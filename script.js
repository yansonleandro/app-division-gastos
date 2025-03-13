// Elementos DOM
const tabButtons = document.querySelectorAll(".tab-btn")
const tabContents = document.querySelectorAll(".tab-content")
const memberForm = document.getElementById("member-form")
const memberNameInput = document.getElementById("member-name")
const membersList = document.getElementById("members-list")
const membersCount = document.getElementById("members-count")
const expenseForm = document.getElementById("expense-form")
const expenseDescription = document.getElementById("expense-description")
const expenseAmount = document.getElementById("expense-amount")
const paidBySelect = document.getElementById("paid-by")
const splitBetweenDiv = document.getElementById("split-between")
const selectAllButton = document.getElementById("select-all")
const expensesList = document.getElementById("expenses-list")
const debtsSummary = document.getElementById("debts-summary")
const deleteAllMembers = document.getElementById("delete-all-members")
const deleteAllExpenses = document.getElementById("delete-all-expenses")

// Modal de confirmación
const modal = document.getElementById("confirmation-modal")
const modalTitle = document.getElementById("modal-title")
const modalMessage = document.getElementById("modal-message")
const modalCancel = document.getElementById("modal-cancel")
const modalConfirm = document.getElementById("modal-confirm")

// Estado de la aplicación
let members = []
let expenses = []
let optimizedDebts = []

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage()
  renderMembers()
  renderExpenseForm()
  renderExpenses()
  calculateDebts()
  renderDebts()

  // Configurar eventos
  setupTabNavigation()
  setupForms()
  setupDeleteButtons()
})

// Configuración de navegación por pestañas
function setupTabNavigation() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Desactivar todas las pestañas
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      // Activar la pestaña seleccionada
      button.classList.add("active")
      const tabId = button.getAttribute("data-tab")
      document.getElementById(tabId).classList.add("active")
    })
  })
}

// Configuración de formularios
function setupForms() {
  // Formulario de miembros
  memberForm.addEventListener("submit", (e) => {
    e.preventDefault()
    addMember(memberNameInput.value)
    memberNameInput.value = ""
  })

  // Formulario de gastos
  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault()

    const description = expenseDescription.value
    const amount = Number.parseFloat(expenseAmount.value)
    const paidBy = paidBySelect.value

    // Obtener los miembros seleccionados para dividir el gasto
    const splitBetween = []
    document.querySelectorAll('input[name="split"]:checked').forEach((checkbox) => {
      splitBetween.push(checkbox.value)
    })

    if (splitBetween.length === 0) {
      alert("Debes seleccionar al menos una persona entre quienes dividir el gasto.")
      return
    }

    addExpense({
      description,
      amount,
      paidBy,
      splitBetween,
    })

    // Limpiar formulario
    expenseDescription.value = ""
    expenseAmount.value = ""
    paidBySelect.value = ""
    document.querySelectorAll('input[name="split"]').forEach((checkbox) => {
      checkbox.checked = false
    })
  })

  // Botón de seleccionar todos
  selectAllButton.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll('input[name="split"]')
    const allChecked = Array.from(checkboxes).every((checkbox) => checkbox.checked)

    checkboxes.forEach((checkbox) => {
      checkbox.checked = !allChecked
    })

    selectAllButton.textContent = allChecked ? "Seleccionar todos" : "Deseleccionar todos"
  })
}

// Configuración de botones de eliminación
function setupDeleteButtons() {
  // Eliminar todos los miembros
  deleteAllMembers.addEventListener("click", () => {
    if (members.length === 0) return

    showConfirmationModal(
      "Eliminar todos los integrantes",
      "¿Estás seguro de que deseas eliminar a todos los integrantes? Esta acción no se puede deshacer.",
      () => {
        // Verificar si hay gastos asociados
        if (expenses.length > 0) {
          alert(
            "No se pueden eliminar todos los integrantes porque hay gastos asociados. Elimina primero todos los gastos.",
          )
          return
        }

        members = []
        saveToLocalStorage()
        renderMembers()
        renderExpenseForm()
      },
    )
  })

  // Eliminar todos los gastos
  deleteAllExpenses.addEventListener("click", () => {
    if (expenses.length === 0) return

    showConfirmationModal(
      "Eliminar todos los gastos",
      "¿Estás seguro de que deseas eliminar todos los gastos? Esta acción no se puede deshacer.",
      () => {
        expenses = []
        saveToLocalStorage()
        renderExpenses()
        calculateDebts()
        renderDebts()
      },
    )
  })

  // Botones del modal
  modalCancel.addEventListener("click", hideConfirmationModal)

  // El evento para modalConfirm se asigna dinámicamente en showConfirmationModal
}

// Funciones para mostrar/ocultar el modal de confirmación
function showConfirmationModal(title, message, confirmCallback) {
  modalTitle.textContent = title
  modalMessage.textContent = message

  // Eliminar el evento anterior si existe
  const oldModalConfirm = document.getElementById("modal-confirm")
  const newModalConfirm = oldModalConfirm.cloneNode(true)
  oldModalConfirm.replaceWith(newModalConfirm)

  // Asignar el nuevo evento
  newModalConfirm.addEventListener("click", () => {
    confirmCallback()
    hideConfirmationModal()
  })

  modal.classList.add("active")
}

function hideConfirmationModal() {
  modal.classList.remove("active")
}

// Funciones para manipular miembros
function addMember(name) {
  if (name.trim() === "") return

  const newMember = {
    id: generateId(),
    name: name.trim(),
  }

  members.push(newMember)
  saveToLocalStorage()
  renderMembers()
  renderExpenseForm()
}

function removeMember(id) {
  // Verificar si el miembro está involucrado en algún gasto
  const isInvolved = expenses.some((expense) => expense.paidBy === id || expense.splitBetween.includes(id))

  if (isInvolved) {
    alert("No se puede eliminar este miembro porque está involucrado en gastos existentes.")
    return
  }

  const member = members.find((member) => member.id === id)
  const memberName = member ? member.name : "Desconocido"

  showConfirmationModal(
    "Eliminar integrante",
    `¿Estás seguro de que deseas eliminar a ${memberName}? Esta acción no se puede deshacer.`,
    () => {
      members = members.filter((member) => member.id !== id)
      saveToLocalStorage()
      renderMembers()
      renderExpenseForm()
    }
  )
}

// Funciones para manipular gastos
function addExpense(expenseData) {
  const newExpense = {
    id: generateId(),
    description: expenseData.description,
    amount: expenseData.amount,
    paidBy: expenseData.paidBy,
    splitBetween: expenseData.splitBetween,
    date: new Date(),
  }

  expenses.push(newExpense)
  saveToLocalStorage()
  renderExpenses()
  calculateDebts()
  renderDebts()
}

function removeExpense(id) {
  const expense = expenses.find((expense) => expense.id === id)
  const expenseDescription = expense ? expense.description : "Desconocido"

  showConfirmationModal(
    "Eliminar gasto",
    `¿Estás seguro de que deseas eliminar el gasto "${expenseDescription}"? Esta acción no se puede deshacer.`,
    () => {
      expenses = expenses.filter((expense) => expense.id !== id)
      saveToLocalStorage()
      renderExpenses()
      calculateDebts()
      renderDebts()
    }
  )
}

// Funciones de renderizado
function renderMembers() {
  membersCount.textContent = members.length

  if (members.length === 0) {
    membersList.innerHTML = '<p class="empty-message">No hay integrantes. Agrega algunos para comenzar.</p>'
    return
  }

  membersList.innerHTML = ""

  members.forEach((member) => {
    const memberItem = document.createElement("div")
    memberItem.className = "list-item"
    memberItem.innerHTML = `
            <span>${member.name}</span>
            <button class="btn danger small delete-member" data-id="${member.id}">Eliminar</button>
        `
    membersList.appendChild(memberItem)
  })

  // Agregar eventos a los botones de eliminar
  document.querySelectorAll(".delete-member").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-id")
      removeMember(id)
    })
  })
}

function renderExpenseForm() {
  // Actualizar el select de quién pagó
  paidBySelect.innerHTML = '<option value="" disabled selected>Selecciona una persona</option>'

  // Actualizar los checkboxes de entre quiénes se divide
  if (members.length === 0) {
    splitBetweenDiv.innerHTML =
      '<p class="empty-message">No hay integrantes. Agrega algunos en la pestaña "Miembros".</p>'
    paidBySelect.disabled = true
    expenseForm.querySelector('button[type="submit"]').disabled = true
  } else {
    splitBetweenDiv.innerHTML = ""
    paidBySelect.disabled = false
    expenseForm.querySelector('button[type="submit"]').disabled = false

    members.forEach((member) => {
      // Agregar opción al select
      const option = document.createElement("option")
      option.value = member.id
      option.textContent = member.name
      paidBySelect.appendChild(option)

      // Agregar checkbox
      const checkboxItem = document.createElement("div")
      checkboxItem.className = "checkbox-item"
      checkboxItem.innerHTML = `
                <input type="checkbox" id="split-${member.id}" name="split" value="${member.id}">
                <label for="split-${member.id}">${member.name}</label>
            `
      splitBetweenDiv.appendChild(checkboxItem)
    })
  }
}

function renderExpenses() {
  if (expenses.length === 0) {
    expensesList.innerHTML =
      '<p class="empty-message">No hay gastos registrados. Agrega algunos en la pestaña "Gastos".</p>'
    return
  }

  // Ordenar gastos por fecha (más reciente primero)
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date))

  expensesList.innerHTML = ""

  sortedExpenses.forEach((expense) => {
    const expenseCard = document.createElement("div")
    expenseCard.className = "expense-card"

    // Obtener nombres de los participantes
    const paidByName = getMemberName(expense.paidBy)
    const participantsHtml = expense.splitBetween
      .map((id) => `<span class="participant-tag">${getMemberName(id)}</span>`)
      .join("")

    expenseCard.innerHTML = `
            <div class="expense-header">
                <span class="expense-title">${expense.description}</span>
                <button class="btn danger small delete-expense" data-id="${expense.id}">Eliminar</button>
            </div>
            <div class="expense-date">${formatDate(new Date(expense.date))}</div>
            <div class="expense-details">
                <div>
                    <div class="expense-detail-label">Monto</div>
                    <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
                </div>
                <div>
                    <div class="expense-detail-label">Pagado por</div>
                    <div>${paidByName}</div>
                </div>
            </div>
            <div>
                <div class="expense-detail-label">Dividido entre</div>
                <div class="expense-participants">
                    ${participantsHtml}
                </div>
            </div>
        `

    expensesList.appendChild(expenseCard)
  })

  // Agregar eventos a los botones de eliminar
  document.querySelectorAll(".delete-expense").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-id")
      removeExpense(id)
    })
  })
}

function renderDebts() {
  if (optimizedDebts.length === 0) {
    debtsSummary.innerHTML = '<p class="empty-message">No hay deudas pendientes entre los integrantes.</p>'
    return
  }

  debtsSummary.innerHTML =
    '<p class="debt-intro">Estas son las transacciones optimizadas para saldar todas las deudas con el mínimo número de pagos:</p>'

  optimizedDebts.forEach((debt) => {
    const debtItem = document.createElement("div")
    debtItem.className = "debt-item"

    debtItem.innerHTML = `
            <div class="debt-parties">
                <span>${getMemberName(debt.from)}</span>
                <span class="debt-arrow">→</span>
                <span>${getMemberName(debt.to)}</span>
            </div>
            <div class="debt-amount">$${debt.amount.toFixed(2)}</div>
        `

    debtsSummary.appendChild(debtItem)
  })
}

// Cálculo de deudas
function calculateDebts() {
  // Crear un mapa de balances para cada miembro
  const balances = new Map()
  members.forEach((member) => {
    balances.set(member.id, 0)
  })

  // Calcular balances iniciales
  expenses.forEach((expense) => {
    const paidBy = expense.paidBy
    const splitBetween = expense.splitBetween
    const amountPerPerson = expense.amount / splitBetween.length

    // La persona que pagó recibe dinero
    balances.set(paidBy, (balances.get(paidBy) || 0) + expense.amount)

    // Las personas entre las que se divide deben dinero
    splitBetween.forEach((personId) => {
      balances.set(personId, (balances.get(personId) || 0) - amountPerPerson)
    })
  })

  // Convertir balances a deudas
  optimizedDebts = []
  const debtors = []
  const creditors = []

  // Separar deudores y acreedores
  balances.forEach((balance, personId) => {
    if (balance < 0) {
      debtors.push([personId, Math.abs(balance)])
    } else if (balance > 0) {
      creditors.push([personId, balance])
    }
  })

  // Ordenar por cantidad (mayor a menor)
  debtors.sort((a, b) => b[1] - a[1])
  creditors.sort((a, b) => b[1] - a[1])

  // Algoritmo para minimizar transacciones
  while (debtors.length > 0 && creditors.length > 0) {
    const [debtorId, debtAmount] = debtors[0]
    const [creditorId, creditAmount] = creditors[0]

    const transactionAmount = Math.min(debtAmount, creditAmount)

    if (transactionAmount > 0.01) {
      // Evitar transacciones muy pequeñas
      optimizedDebts.push({
        from: debtorId,
        to: creditorId,
        amount: Math.round(transactionAmount * 100) / 100, // Redondear a 2 decimales
      })
    }

    // Actualizar saldos
    if (debtAmount > creditAmount) {
      debtors[0][1] = debtAmount - creditAmount
      creditors.shift()
    } else if (creditAmount > debtAmount) {
      creditors[0][1] = creditAmount - debtAmount
      debtors.shift()
    } else {
      debtors.shift()
      creditors.shift()
    }
  }
}

// Funciones de utilidad
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

function getMemberName(id) {
  const member = members.find((m) => m.id === id)
  return member ? member.name : "Desconocido"
}

function formatDate(date) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

// Persistencia de datos
function saveToLocalStorage() {
  localStorage.setItem("dividir-gastos-members", JSON.stringify(members))
  localStorage.setItem("dividir-gastos-expenses", JSON.stringify(expenses))
}

function loadFromLocalStorage() {
  const savedMembers = localStorage.getItem("dividir-gastos-members")
  const savedExpenses = localStorage.getItem("dividir-gastos-expenses")

  if (savedMembers) {
    members = JSON.parse(savedMembers)
  }

  if (savedExpenses) {
    expenses = JSON.parse(savedExpenses)
  }
}

