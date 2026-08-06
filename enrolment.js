const enrolmentForm = document.getElementById('enrolmentForm');
const completedDate = document.getElementById('completedDate');
const dateOfBirth = document.getElementById('dateOfBirth');
const signaturePad = document.getElementById('signaturePad');
const clearSignature = document.getElementById('clearSignature');
const enrolmentError = document.getElementById('enrolmentError');

const formatToday = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${now.getFullYear()}`;
};

completedDate.value = formatToday();

dateOfBirth.addEventListener('input', () => {
  const digits = dateOfBirth.value.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  dateOfBirth.value = [day, month, year].filter(Boolean).join('-');
});

const ctx = signaturePad.getContext('2d');
let isDrawing = false;
let hasSignature = false;

const resetSignature = () => {
  ctx.clearRect(0, 0, signaturePad.width, signaturePad.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, signaturePad.width, signaturePad.height);
  ctx.strokeStyle = '#0B2545';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  hasSignature = false;
};

const getPoint = event => {
  const rect = signaturePad.getBoundingClientRect();
  const pointer = event.touches ? event.touches[0] : event;
  return {
    x: ((pointer.clientX - rect.left) / rect.width) * signaturePad.width,
    y: ((pointer.clientY - rect.top) / rect.height) * signaturePad.height
  };
};

const startDrawing = event => {
  event.preventDefault();
  isDrawing = true;
  const point = getPoint(event);
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
};

const draw = event => {
  if (!isDrawing) return;
  event.preventDefault();
  const point = getPoint(event);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
  hasSignature = true;
};

const stopDrawing = () => {
  isDrawing = false;
};

signaturePad.addEventListener('mousedown', startDrawing);
signaturePad.addEventListener('mousemove', draw);
signaturePad.addEventListener('mouseup', stopDrawing);
signaturePad.addEventListener('mouseleave', stopDrawing);
signaturePad.addEventListener('touchstart', startDrawing, { passive: false });
signaturePad.addEventListener('touchmove', draw, { passive: false });
signaturePad.addEventListener('touchend', stopDrawing);
clearSignature.addEventListener('click', resetSignature);

resetSignature();

const cleanFileName = value => String(value || '')
  .trim()
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-+|-+$/g, '') || 'student';

const downloadEnrolmentPdf = formData => {
  if (!window.jspdf?.jsPDF) {
    enrolmentError.textContent = 'The PDF download tool could not load. Please refresh the page and try again.';
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;
  let y = 46;

  const value = name => String(formData.get(name) || '').trim();
  const ensureSpace = needed => {
    if (y + needed <= pageHeight - margin) return;
    doc.addPage();
    y = margin;
  };
  const addTitle = text => {
    ensureSpace(42);
    doc.setFillColor(11, 37, 69);
    doc.rect(margin, y, contentWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(text, margin + 12, y + 20);
    y += 44;
  };
  const addPair = (label, text) => {
    const lines = doc.splitTextToSize(text || '-', contentWidth - 160);
    const rowHeight = Math.max(24, lines.length * 14 + 8);
    ensureSpace(rowHeight);
    doc.setTextColor(11, 37, 69);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(label, margin, y + 13);
    doc.setTextColor(26, 26, 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(lines, margin + 160, y + 13);
    y += rowHeight;
  };

  doc.setTextColor(11, 37, 69);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Swimming Lesson Enrolment Form', margin, y);
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(63, 70, 80);
  doc.text(`Barnet Premier Swim | Completed on ${value('completedDate')}`, margin, y);
  y += 28;

  addTitle('Student Details');
  addPair('Student surname', value('studentSurname'));
  addPair('First name', value('studentFirstName'));
  addPair('Date of birth', value('dateOfBirth'));
  addPair('Gender', value('gender'));
  addPair('Swimming ability', value('swimmingAbility'));

  addTitle('Home Address');
  addPair('Address', value('address'));
  addPair('Postcode', value('postcode'));

  addTitle('Parent/Guardian Details');
  addPair('Name', value('guardianName'));
  addPair('Telephone number', value('guardianPhone'));
  addPair('Email', value('guardianEmail'));

  addTitle('Medical and Additional Information');
  addPair('Details', value('medicalDetails'));

  addTitle('Photo Permission');
  addPair('Permission given', value('photoPermission'));

  addTitle('Signature');
  ensureSpace(110);
  doc.addImage(signaturePad.toDataURL('image/png'), 'PNG', margin, y, 260, 75);
  y += 92;
  doc.setTextColor(63, 70, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Signed by parent/guardian on ${value('completedDate')}`, margin, y);

  const fileName = `Barnet-Premier-Swim-Enrolment-${cleanFileName(value('studentFirstName'))}-${cleanFileName(value('studentSurname'))}.pdf`;
  doc.save(fileName);
};

enrolmentForm.addEventListener('submit', event => {
  event.preventDefault();
  enrolmentError.textContent = '';

  if (!enrolmentForm.reportValidity()) return;

  if (!hasSignature) {
    enrolmentError.textContent = 'Please add a signature before printing the PDF.';
    signaturePad.focus();
    return;
  }

  const formData = new FormData(enrolmentForm);
  downloadEnrolmentPdf(formData);
});
