const navToggle = document.getElementById('navToggle');
const navbarLinks = document.getElementById('navbar-links');
if (navToggle && navbarLinks) {
  navToggle.addEventListener('click', () => {
    navbarLinks.classList.toggle('show');
  });
}