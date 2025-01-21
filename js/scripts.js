document.addEventListener('DOMContentLoaded', function() {
    const greetingElement = document.getElementById('greeting');
    const now = new Date();
    const hours = now.getHours();
    let greeting;

    if (hours < 12) {
        greeting = 'Good morning!';
    } else if (hours < 18) {
        greeting = 'Good afternoon!';
    } else {
        greeting = 'Good evening!';
    }

    greetingElement.textContent = greeting;

    // Back to Top button functionality
    const backToTopButton = document.getElementById('back-to-top');

    window.onscroll = function() {
        scrollFunction();
    };

    function scrollFunction() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    }

    backToTopButton.addEventListener('click', function() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    });
});