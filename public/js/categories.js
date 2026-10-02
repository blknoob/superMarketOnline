document.addEventListener('DOMContentLoaded', function() {
  // Manejar el toggle de categorías
  const categoryToggles = document.querySelectorAll('.category-toggle');
  
  categoryToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const categoryItem = this.closest('.category-item');
      const subcategories = categoryItem.querySelector('.subcategories');
      const categoryMain = categoryItem.querySelector('.category-main');
      
      // Toggle la visualización de subcategorías
      if (subcategories.classList.contains('show')) {
        subcategories.classList.remove('show');
        this.style.transform = 'rotate(0deg)';
      } else {
        // Cerrar otras categorías abiertas
        document.querySelectorAll('.subcategories.show').forEach(sub => {
          sub.classList.remove('show');
        });
        document.querySelectorAll('.category-toggle').forEach(t => {
          t.style.transform = 'rotate(0deg)';
        });
        
        // Abrir esta categoría
        subcategories.classList.add('show');
        this.style.transform = 'rotate(180deg)';
      }
    });
  });

  // Hacer clickeable toda el área de la categoría principal
  const categoryMains = document.querySelectorAll('.category-main');
  
  categoryMains.forEach(main => {
    main.addEventListener('click', function(e) {
      if (e.target.classList.contains('category-toggle')) {
        return; // No hacer nada si se clickeó el toggle
      }
      
      const link = this.querySelector('.category-link');
      if (link && link.href) {
        window.location.href = link.href;
      }
    });
  });

  // Auto-expandir la categoría activa
  const activeCategory = document.querySelector('.category-main.active');
  if (activeCategory) {
    const categoryItem = activeCategory.closest('.category-item');
    const subcategories = categoryItem.querySelector('.subcategories');
    const toggle = categoryItem.querySelector('.category-toggle');
    
    if (subcategories && toggle) {
      subcategories.classList.add('show');
      toggle.style.transform = 'rotate(180deg)';
    }
  }
});