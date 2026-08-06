const enrolmentForm = document.getElementById('enrolmentForm');
const completedDate = document.getElementById('completedDate');
const dateOfBirth = document.getElementById('dateOfBirth');
const signaturePad = document.getElementById('signaturePad');
const clearSignature = document.getElementById('clearSignature');
const enrolmentError = document.getElementById('enrolmentError');
const printDocument = document.getElementById('printDocument');
const printSignature = document.getElementById('printSignature');

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
  const fields = printDocument.querySelectorAll('[data-print-field]');

  fields.forEach(field => {
    const name = field.dataset.printField;
    field.textContent = formData.get(name) || '';
  });

  const printWhenReady = () => {
    printSignature.onload = null;
    window.print();
  };

  printSignature.onload = printWhenReady;
  printSignature.src = signaturePad.toDataURL('image/png');
  if (printSignature.complete) printWhenReady();
});
