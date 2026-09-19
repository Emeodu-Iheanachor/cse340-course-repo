const navToggle = document.querySelector('.nav-toggle')
const navigation = document.querySelector('#site-navigation')

if (navToggle && navigation) {
    navToggle.addEventListener('click', () => {
        const isOpen = navigation.classList.toggle('nav-open')

        navToggle.setAttribute('aria-expanded', isOpen)
        navToggle.setAttribute(
            'aria-label',
            isOpen ? 'Close navigation menu' : 'Open navigation menu'
        )
    })
}