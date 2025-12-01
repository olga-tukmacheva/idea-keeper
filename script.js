/* ========= НАСТРОЙКА SUPABASE ========= */

const SUPABASE_URL = "https://skpjusvtxyofrtnnjrkc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcGp1c3Z0eHlvZnJ0bm5qcmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NzEwNTksImV4cCI6MjA4MDE0NzA1OX0.wC_8wrPm6pMMLzJsqxfJi9cOGg9L-dK2daE4Ws5FmG8";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ========= ГЛОБАЛЬНЫЕ МАССИВЫ ========= */

let people = [];
let ideas = [];
let categoriesList = ["Хобби", "Книги", "Гаджеты", "Для дома", "Одежда", "Красота", "Для кухни", "Аксессуары", "Креативные"];

/* ========= ЗАГРУЗКА ДАННЫХ ========= */

async function loadPeople() {
  const { data, error } = await supabaseClient.from("people").select("*").order("created_at");

  if (error) {
    console.error("Ошибка загрузки людей:", error);
    return;
  }

  people = data;
  updatePeopleSelects();
}

async function loadCategories() {
  // уже есть фиксированный список
}

async function loadIdeas() {
  const { data, error } = await supabaseClient.from("ideas").select("*").order("created_at");

  if (error) {
    console.error("Ошибка загрузки идей:", error);
    return;
  }

  ideas = data;
  renderIdeas(ideas);
}

/* ========= ОБНОВЛЕНИЕ SELECT ========= */

function updatePeopleSelects() {
  const selects = [
    document.getElementById("filter-person"),
    document.getElementById("idea-person")
  ];

  selects.forEach(sel => {
    if (!sel) return;
    const current = sel.value;

    sel.innerHTML = sel.id === "filter-person"
      ? `<option value="all">Все</option>`
      : `<option value="">Выберите человека</option>`;

    people.forEach(p => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.name;
      sel.appendChild(option);
    });

    if (current) sel.value = current;
  });
}

/* ========= ДОБАВЛЕНИЕ ЧЕЛОВЕКА ========= */

async function addPerson(e) {
  e.preventDefault();

  const name = document.getElementById("person-name").value.trim();
  const relation = document.getElementById("person-relation").value.trim();

  if (!name) return alert("Введите имя");

  const { error } = await supabaseClient.from("people").insert([{ name, relation }]);

  if (error) {
    alert("Ошибка сохранения человека");
    return;
  }

  document.getElementById("person-name").value = "";
  document.getElementById("person-relation").value = "";

  loadPeople();
}

/* ========= ДОБАВЛЕНИЕ ИДЕИ ========= */

async function addIdea(e) {
  e.preventDefault();

  const person_id = document.getElementById("idea-person").value;
  const title = document.getElementById("idea-title").value.trim();
  const link = document.getElementById("idea-link").value.trim();
  const price = document.getElementById("idea-price").value.trim();
  const category = document.getElementById("idea-category").value;
  const comment = document.getElementById("idea-comment").value.trim();
  const status = document.getElementById("idea-status").value;

  if (!person_id) return alert("Выберите человека");
  if (!title) return alert("Введите идею");

  const { error } = await supabaseClient.from("ideas").insert([
    {
      person_id,
      title,
      link: link || null,
      price: price || null,
      category,
      comment,
      status
    }
  ]);

  if (error) {
    alert("Ошибка сохранения идеи");
    return;
  }

  document.getElementById("idea-title").value = "";
  document.getElementById("idea-link").value = "";
  document.getElementById("idea-price").value = "";
  document.getElementById("idea-category").value = "";
  document.getElementById("idea-comment").value = "";
  document.getElementById("idea-status").value = "idea";

  loadIdeas();
}

/* ========= РЕНДЕР ИДЕЙ ========= */

function renderIdeas(list) {
  const container = document.getElementById("ideas-list");
  const count = document.getElementById("ideas-count");

  container.innerHTML = "";

  count.textContent = `${list.length} идей`;

  list.forEach(idea => {
    const card = document.createElement("div");
    card.className = "idea-card";
    card.id = `idea-${idea.id}`;

    const personName = people.find(p => p.id === idea.person_id)?.name || "—";

    card.innerHTML = `
      <div class="idea-title">${idea.title}</div>
      <div class="idea-meta">${idea.price ? idea.price + " ₽" : ""}</div>
      <div class="idea-meta">${idea.category || ""}</div>
      <div class="idea-meta">${personName}</div>
      <div class="idea-meta">Статус: ${idea.status}</div>

      <div class="idea-actions">
        <button class="edit-btn" onclick="editIdea('${idea.id}')">Редактировать</button>
        <button class="delete-btn" onclick="deleteIdea('${idea.id}')">Удалить</button>
      </div>
    `;

    container.appendChild(card);
  });
}

/* ========= РЕДАКТИРОВАНИЕ ========= */

function editIdea(id) {
  const idea = ideas.find(i => i.id === id);

  if (!idea) return;

  const wrap = document.getElementById(`idea-${id}`);

  wrap.innerHTML = `
    <div class="edit-form">

      <label>Название:</label>
      <input id="edit-title" value="${idea.title}" />

      <label>Цена:</label>
      <input id="edit-price" type="number" value="${idea.price || ""}" />

      <label>Ссылка:</label>
      <input id="edit-link" value="${idea.link || ""}" />

      <label>Категория:</label>
      <select id="edit-category">
        ${categoriesList.map(c => `<option value="${c}" ${c === idea.category ? "selected" : ""}>${c}</option>`).join("")}
      </select>

      <label>Комментарий:</label>
      <textarea id="edit-comment">${idea.comment || ""}</textarea>

      <label>Статус:</label>
      <select id="edit-status">
        <option value="idea" ${idea.status === "idea" ? "selected" : ""}>Идея</option>
        <option value="planned" ${idea.status === "planned" ? "selected" : ""}>Запланировано</option>
        <option value="ordered" ${idea.status === "ordered" ? "selected" : ""}>Заказано</option>
        <option value="packed" ${idea.status === "packed" ? "selected" : ""}>Упаковано</option>
        <option value="bought" ${idea.status === "bought" ? "selected" : ""}>Куплено</option>
        <option value="given" ${idea.status === "given" ? "selected" : ""}>Подарено</option>
      </select>

      <div class="edit-buttons">
        <button onclick="saveIdeaChanges('${id}')" class="save-edit-btn">Сохранить</button>
        <button onclick="loadIdeas()" class="cancel-edit-btn">Отмена</button>
      </div>

    </div>
  `;
}

async function saveIdeaChanges(id) {
  const newData = {
    title: document.getElementById("edit-title").value.trim(),
    price: document.getElementById("edit-price").value.trim() || null,
    link: document.getElementById("edit-link").value.trim() || null,
    category: document.getElementById("edit-category").value,
    comment: document.getElementById("edit-comment").value.trim(),
    status: document.getElementById("edit-status").value
  };

  await supabaseClient.from("ideas").update(newData).eq("id", id);

  loadIdeas();
}

/* ========= УДАЛЕНИЕ ========= */

async function deleteIdea(id) {
  if (!confirm("Удалить идею?")) return;

  await supabaseClient.from("ideas").delete().eq("id", id);
  loadIdeas();
}

/* ========= ФИЛЬТР ========= */

document.getElementById("filter-form").addEventListener("submit", function (e) {
  e.preventDefault();

  let result = ideas;

  const person = document.getElementById("filter-person").value;
  const status = document.getElementById("filter-status").value;
  const min = Number(document.getElementById("price-min").value);
  const max = Number(document.getElementById("price-max").value);

  if (person !== "all") result = result.filter(i => i.person_id === person);
  if (status !== "all") result = result.filter(i => i.status === status);
  if (min) result = result.filter(i => (i.price || 0) >= min);
  if (max) result = result.filter(i => (i.price || 0) <= max);

  renderIdeas(result);
});

document.getElementById("reset-filters").addEventListener("click", () => {
  document.getElementById("filter-person").value = "all";
  document.getElementById("filter-status").value = "all";
  document.getElementById("price-min").value = 0;
  document.getElementById("price-max").value = 5000;

  renderIdeas(ideas);
});

/* ========= СТАРТ ========= */

document.getElementById("add-person-form").addEventListener("submit", addPerson);
document.getElementById("add-idea-form").addEventListener("submit", addIdea);

loadPeople();
loadCategories();
loadIdeas();
