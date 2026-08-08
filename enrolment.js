const enrolmentForm = document.getElementById('enrolmentForm');
const completedDate = document.getElementById('completedDate');

const formatToday = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${now.getFullYear()}`;
};

completedDate.value = formatToday();

enrolmentForm.addEventListener('submit', () => {
  completedDate.value = formatToday();
});
