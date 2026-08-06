const enrolmentForm = document.getElementById('enrolmentForm');
const completedDate = document.getElementById('completedDate');
const dateOfBirth = document.getElementById('dateOfBirth');

const formatToday = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${now.getFullYear()}`;
};

completedDate.value = formatToday();

dateOfBirth.addEventListener('input', () => {
  dateOfBirth.setCustomValidity('');
  const digits = dateOfBirth.value.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  dateOfBirth.value = [day, month, year].filter(Boolean).join('-');
});

dateOfBirth.addEventListener('blur', () => {
  const value = dateOfBirth.value;
  if (!value) return;
  const [dayText, monthText, yearText] = value.split('-');
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const enteredDate = new Date(year, month - 1, day);
  const isRealDate = enteredDate.getFullYear() === year &&
    enteredDate.getMonth() === month - 1 &&
    enteredDate.getDate() === day;

  if (!isRealDate) {
    dateOfBirth.setCustomValidity('Please enter a real date in dd-mm-yyyy format.');
    dateOfBirth.reportValidity();
  }
});

enrolmentForm.addEventListener('submit', () => {
  completedDate.value = formatToday();
});
