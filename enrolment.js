const enrolmentForm = document.getElementById('enrolmentForm');
const completedDate = document.getElementById('completedDate');
const dateFields = document.querySelectorAll('[data-date-field]');

const formatToday = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${now.getFullYear()}`;
};

completedDate.value = formatToday();

const formatDateInput = input => {
  input.setCustomValidity('');
  const digits = input.value.replace(/\D/g, '').slice(0, 8);
  if (!isAllowedDateProgress(digits)) {
    input.value = input.dataset.lastValidDate || '';
    return;
  }

  if (digits.length <= 2) {
    input.value = digits.length === 2 ? `${digits}-` : digits;
  } else if (digits.length <= 4) {
    input.value = digits.length === 4
      ? `${digits.slice(0, 2)}-${digits.slice(2, 4)}-`
      : `${digits.slice(0, 2)}-${digits.slice(2)}`;
  } else {
    input.value = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
  }
  input.dataset.lastValidDate = input.value;
};

const isAllowedDateProgress = digits => {
  if (!digits) return true;
  const dayFirst = Number(digits.slice(0, 1));
  if (dayFirst > 3) return false;

  if (digits.length >= 2) {
    const day = Number(digits.slice(0, 2));
    if (day < 1 || day > 31) return false;
  }

  if (digits.length >= 3) {
    const monthFirst = Number(digits.slice(2, 3));
    if (monthFirst > 1) return false;
  }

  if (digits.length >= 4) {
    const month = Number(digits.slice(2, 4));
    if (month < 1 || month > 12) return false;
  }

  if (digits.length >= 5) {
    const firstYearDigit = digits.slice(4, 5);
    if (firstYearDigit !== '1' && firstYearDigit !== '2') return false;
  }

  if (digits.length >= 6 && digits.slice(4, 5) === '1' && digits.slice(5, 6) !== '9') {
    return false;
  }

  return true;
};

const validateRealDate = input => {
  const value = input.value;
  if (!value) return true;
  const [dayText, monthText, yearText] = value.split('-');
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const enteredDate = new Date(year, month - 1, day);
  const isRealDate = enteredDate.getFullYear() === year &&
    enteredDate.getMonth() === month - 1 &&
    enteredDate.getDate() === day;

  if (!isRealDate) {
    input.setCustomValidity('Please enter a real date in dd-mm-yyyy format.');
    input.reportValidity();
    return false;
  }
  return true;
};

dateFields.forEach(input => {
  input.addEventListener('input', () => formatDateInput(input));
  input.addEventListener('blur', () => validateRealDate(input));
});

enrolmentForm.addEventListener('submit', event => {
  completedDate.value = formatToday();
  const datesAreValid = Array.from(dateFields).every(validateRealDate);
  if (!datesAreValid) event.preventDefault();
});
