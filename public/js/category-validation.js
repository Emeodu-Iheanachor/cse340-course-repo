document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#category-form')
  const input = document.querySelector('#category_name')
  const error = document.querySelector('#category-name-error')

  if (!form || !input || !error) {
    return
  }

  const validateCategoryName = () => {
    const value = input.value.trim()

    error.textContent = ''
    input.removeAttribute('aria-invalid')

    if (value.length === 0) {
      error.textContent = 'Category name is required.'
      input.setAttribute('aria-invalid', 'true')
      return false
    }

    if (value.length > 100) {
      error.textContent =
        'Category name must not exceed 100 characters.'

      input.setAttribute('aria-invalid', 'true')
      return false
    }

    return true
  }


  input.addEventListener('input', () => {
    validateCategoryName()
  })


  form.addEventListener('submit', (event) => {
    if (!validateCategoryName()) {
      event.preventDefault()
      input.focus()
    }
  })
})
