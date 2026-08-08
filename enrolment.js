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
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  input.value = [day, month, year].filter(Boolean).join('-');
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
