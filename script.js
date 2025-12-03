// ВСТАВЬ СЮДА СВОИ ДАННЫЕ SUPABASE
const SUPABASE_URL = "https://skpjusvtxyofrtnnjrkc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcGp1c3Z0eHlvZnJ0bm5qcmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NzEwNTksImV4cCI6MjA4MDE0NzA1OX0.wC_8wrPm6pMMLzJsqxfJi9cOGg9L-dK2daE4Ws5FmG8";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// Отображаемые названия статусов
const STATUS_LABELS = {
  idea: "Идея",
  planned: "Запланировано",
  ordered: "Заказано",
  packed: "Упаковано",
  gifted: "Подарено",
};

// Глобальные данные
let people = [];
let categories = [];
let ideas = [];
let editingIdeaId = null;

// Элементы DOM
const addPersonForm = document.getElementById("add-person-form");
const personNameInput = document.getElementById("person-name");
const personRelationInput = document.getElementById("person-relation");

const filterForm = document.getElementById("filter-form");
const filterPersonSelect = document.getElementById("filter-person");
const filterStatusSelect = document.getElementById("filter-status");
const priceMinInput = document.getElementById("price-min");
const priceMaxInput = document.getElementById("price-max");
const resetFiltersBtn = document.getElementById("reset-filters");

const ideasList = document.getElementById("ideas-list");
const ideasCountSpan = document.getElementById("ideas-count");

const addIdeaForm = document.getElementById("add-idea-form");
const ideaFormTitle = document.getElementById("idea-form-title");
const ideaCancelEditBtn = document.getElementById("idea-cancel-edit");
const ideaSubmitBtn = document.getElementById("idea-submit");

const ideaPersonSelect = document.getElementById("idea-person");
const ideaTitleInput = document.getElementById("idea-title");
const ideaLinkInput = document.getElementById("idea-link");
const ideaPriceInput = document.getElementById("idea-price");
const ideaCategorySelect = document.getElementById("idea-category");
const ideaCommentInput = document.getElementById("idea-comment");
const ideaStatusSelect = document.getElementById("idea-status");

// Инициализация
document.addEventListener("DOMContentLoaded", async () => {
  await loadPeople();
  await loadCategories();
  await loadIdeas();
  setupEventListeners();
});

// Загрузка людей
async function loadPeople() {
  const { data, error } = await supabaseClient
    .from("people")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Ошибка загрузки людей:", error);
    alert("Не удалось загрузить список людей.");
    return;
  }

  people = data || [];
  renderPeopleSelects();
}

// Загрузка категорий
async function loadCategories() {
  const { data, error } = await supabaseClient
    .from("categories")
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    console.error("Ошибка загрузки категорий:", error);
    return;
  }

  categories = data || [];
  renderCategoriesSelect();
}

// Загрузка идей
async function loadIdeas() {
  const { data, error } = await supabaseClient
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Ошибка загрузки идей:", error);
    alert("Не удалось загрузить идеи.");
    return;
  }

  ideas = data || [];
  renderIdeas();
}

// Наполнение селектов
function renderPeopleSelects() {
  // Для фильтра
  filterPersonSelect.innerHTML = `<option value="all">Все</option>`;
  people.forEach((person) => {
    const option = document.createElement("option");
    option.value = person.id;
    option.textContent = person.name;
    filterPersonSelect.appendChild(option);
  });

  // Для формы идеи
  ideaPersonSelect.innerHTML = `<option value="">Выберите человека</option>`;
  people.forEach((person) => {
    const option = document.createElement("option");
    option.value = person.id;
    option.textContent = person.name;
    ideaPersonSelect.appendChild(option);
  });
}

function renderCategoriesSelect() {
  ideaCategorySelect.innerHTML = `<option value="">Выберите категорию</option>`;
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.title;
    option.textContent = cat.title;
    ideaCategorySelect.appendChild(option);
  });
}

// Рендер списка идей с учётом фильтров
function renderIdeas() {
  ideasList.innerHTML = "";

  const personFilter = filterPersonSelect.value;
  const statusFilter = filterStatusSelect.value;
  const minPrice = priceMinInput.value ? Number(priceMinInput.value) : null;
  const maxPrice = priceMaxInput.value ? Number(priceMaxInput.value) : null;

  // создаём мапу людей для быстрого доступа
  const peopleMap = {};
  for (const p of people) {
    peopleMap[p.id] = p;
  }

  const filtered = ideas.filter((idea) => {
    if (personFilter !== "all" && idea.person_id !== personFilter) {
      return false;
    }
    if (statusFilter !== "all" && idea.status !== statusFilter) {
      return false;
    }
    if (minPrice !== null && idea.price !== null && idea.price < minPrice) {
      return false;
    }
    if (maxPrice !== null && idea.price !== null && idea.price > maxPrice) {
      return false;
    }
    return true;
  });

  ideasCountSpan.textContent =
    filtered.length === 1 ? "1 идея" : `${filtered.length} идей`;

  filtered.forEach((idea) => {
    const person = peopleMap[idea.person_id];
    const card = createIdeaCard(idea, person);
    ideasList.appendChild(card);
  });
}

// Создание карточки идеи
function createIdeaCard(idea, person) {
  const card = document.createElement("article");
  card.className = "idea-card";
  card.dataset.id = idea.id;

  const statusLabel = STATUS_LABELS[idea.status] || idea.status || "Идея";
  const statusClass = `status-${idea.status || "idea"}`;

  // Основная часть
  const mainDiv = document.createElement("div");
  mainDiv.className = "idea-main";

  const headerDiv = document.createElement("div");
  headerDiv.className = "idea-header";

  const titleDiv = document.createElement("div");
  titleDiv.className = "idea-title";
  titleDiv.textContent = idea.title;

  const priceDiv = document.createElement("div");
  priceDiv.className = "idea-price";
  priceDiv.textContent = idea.price ? `${idea.price} ₽` : "";

  headerDiv.appendChild(titleDiv);
  headerDiv.appendChild(priceDiv);

  const metaDiv = document.createElement("div");
  metaDiv.className = "idea-meta";

  const line1 = document.createElement("div");
  line1.textContent = person ? person.name : "Без человека";

  const line2 = document.createElement("div");
  line2.textContent = idea.category || "";

  metaDiv.appendChild(line1);
  if (idea.category) metaDiv.appendChild(line2);

  mainDiv.appendChild(headerDiv);
  mainDiv.appendChild(metaDiv);

  // Статус-бар
  const statusBar = document.createElement("div");
  statusBar.className = `status-bar ${statusClass}`;
  const statusFill = document.createElement("div");
  statusFill.className = "status-fill";
  statusFill.textContent = statusLabel;
  statusBar.appendChild(statusFill);

  // Футер с кнопкой "Подробнее"
  const footerDiv = document.createElement("div");
  footerDiv.className = "idea-footer";

  const detailsToggle = document.createElement("button");
  detailsToggle.type = "button";
  detailsToggle.className = "btn btn-secondary details-toggle";
  detailsToggle.textContent = "Подробнее";

  footerDiv.appendChild(detailsToggle);

  // Детали
  const detailsDiv = document.createElement("div");
  detailsDiv.className = "idea-details hidden";

  if (idea.comment) {
    const row = document.createElement("div");
    row.className = "idea-details-row";
    row.innerHTML = `<span class="idea-details-label">Комментарий:</span> ${
      idea.comment
    }`;
    detailsDiv.appendChild(row);
  }

  if (idea.link) {
    const row = document.createElement("div");
    row.className = "idea-details-row";
    const a = document.createElement("a");
    a.href = idea.link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "idea-link";
    a.textContent = "Открыть ссылку";
    row.innerHTML = `<span class="idea-details-label">Ссылка:</span> `;
    row.appendChild(a);
    detailsDiv.appendChild(row);
  }

  const statusRow = document.createElement("div");
  statusRow.className = "idea-details-row";
  statusRow.innerHTML = `<span class="idea-details-label">Статус:</span> ${statusLabel}`;
  detailsDiv.appendChild(statusRow);

  // Кнопки действий
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "idea-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn btn-secondary";
  editBtn.textContent = "Редактировать";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn btn-danger";
  deleteBtn.textContent = "Удалить";

  actionsDiv.appendChild(editBtn);
  actionsDiv.appendChild(deleteBtn);
  detailsDiv.appendChild(actionsDiv);

  // Сборка
  card.appendChild(mainDiv);
  card.appendChild(statusBar);
  card.appendChild(footerDiv);
  card.appendChild(detailsDiv);

  // Обработчики
  detailsToggle.addEventListener("click", () => {
    const isHidden = detailsDiv.classList.contains("hidden");
    detailsDiv.classList.toggle("hidden", !isHidden);
    detailsToggle.textContent = isHidden ? "Скрыть" : "Подробнее";
  });

  editBtn.addEventListener("click", () => startEditIdea(idea));
  deleteBtn.addEventListener("click", () => deleteIdea(idea));

  return card;
}

// Настройка слушателей
function setupEventListeners() {
  // Добавление человека
  addPersonForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = personNameInput.value.trim();
    const relation = personRelationInput.value.trim() || null;

    if (!name) return;

    const { error } = await supabaseClient.from("people").insert({
      name,
      relation,
    });

    if (error) {
      console.error("Ошибка сохранения человека:", error);
      alert("Не удалось сохранить человека.");
      return;
    }

    personNameInput.value = "";
    personRelationInput.value = "";
    await loadPeople();
  });

  // Фильтр
  filterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    renderIdeas();
  });

  resetFiltersBtn.addEventListener("click", () => {
    filterPersonSelect.value = "all";
    filterStatusSelect.value = "all";
    priceMinInput.value = "";
    priceMaxInput.value = "";
    renderIdeas();
  });

  // Сохранение идеи (новой или редактируемой)
  addIdeaForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!ideaPersonSelect.value || !ideaTitleInput.value.trim()) {
      alert("Выберите человека и укажите название идеи.");
      return;
    }

    const payload = collectIdeaPayload();

    try {
      if (editingIdeaId) {
        const { error } = await supabaseClient
          .from("ideas")
          .update(payload)
          .eq("id", editingIdeaId);

        if (error) throw error;
      } else {
        const { error } = await supabaseClient.from("ideas").insert(payload);
        if (error) throw error;
      }

      await loadIdeas();
      setIdeaFormMode("create");
    } catch (error) {
      console.error("Ошибка сохранения идеи:", error);
      alert("Не удалось сохранить идею.");
    }
  });

  ideaCancelEditBtn.addEventListener("click", () => {
    setIdeaFormMode("create");
  });
}

// Сбор данных формы идеи
function collectIdeaPayload() {
  const title = ideaTitleInput.value.trim();
  const link = ideaLinkInput.value.trim() || null;
  const price =
    ideaPriceInput.value.trim() === ""
      ? null
      : Number(ideaPriceInput.value.trim());
  const category = ideaCategorySelect.value || null;
  const comment = ideaCommentInput.value.trim() || null;
  const status = ideaStatusSelect.value || "idea";

  return {
    person_id: ideaPersonSelect.value,
    title,
    link,
    price,
    category,
    comment,
    status,
  };
}

// Режим формы: создание / редактирование
function setIdeaFormMode(mode, idea) {
  if (mode === "edit" && idea) {
    editingIdeaId = idea.id;
    ideaFormTitle.textContent = "Редактирование идеи";
    ideaSubmitBtn.textContent = "Сохранить изменения";
    ideaCancelEditBtn.classList.remove("hidden");
  } else {
    editingIdeaId = null;
    ideaFormTitle.textContent = "Новая идея";
    ideaSubmitBtn.textContent = "Сохранить идею";
    ideaCancelEditBtn.classList.add("hidden");
    addIdeaForm.reset();
    // вернуть плейсхолдеры для селектов
    ideaPersonSelect.value = "";
    ideaCategorySelect.value = "";
    ideaStatusSelect.value = "idea";
  }
}

// Запуск редактирования
function startEditIdea(idea) {
  const personId = idea.person_id || "";
  const title = idea.title || "";
  const link = idea.link || "";
  const price = idea.price != null ? String(idea.price) : "";
  const category = idea.category || "";
  const comment = idea.comment || "";
  const status = idea.status || "idea";

  ideaPersonSelect.value = personId;
  ideaTitleInput.value = title;
  ideaLinkInput.value = link;
  ideaPriceInput.value = price;
  ideaCategorySelect.value = category;
  ideaCommentInput.value = comment;
  ideaStatusSelect.value = status;

  setIdeaFormMode("edit", idea);
}

// Удаление идеи
async function deleteIdea(idea) {
  const confirmDelete = confirm(
    `Удалить идею «${idea.title}»? Это действие нельзя будет отменить.`
  );
  if (!confirmDelete) return;

  const { error } = await supabaseClient
    .from("ideas")
    .delete()
    .eq("id", idea.id);

  if (error) {
    console.error("Ошибка удаления идеи:", error);
    alert("Не удалось удалить идею.");
    return;
  }

  await loadIdeas();
  // если удаляем редактируемую — выходим из режима редактирования
  if (editingIdeaId === idea.id) {
    setIdeaFormMode("create");
  }
}
