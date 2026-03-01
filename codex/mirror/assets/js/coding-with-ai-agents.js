const cursor = document.getElementById('cursor');
document.addEventListener('mousemove', e => {
  cursor.style.transform = `translate(${e.clientX - 2}px, ${e.clientY}px)`;
});
document.addEventListener('mousedown', () => cursor.style.opacity = '0');
document.addEventListener('mouseup', () => cursor.style.opacity = '1');