const DEFAULT_GOAL = 2000;
const storageKey = "calm-calories-state";

const caloriesEatenEl = document.querySelector("#calories-eaten");
const remainingCaloriesEl = document.querySelector("#remaining-calories");
const goalLabelEl = document.querySelector("#goal-label");
const progressBarEl = document.querySelector("#progress-bar");
const foodTotalEl = document.querySelector("#food-total");
const exerciseTotalEl = document.querySelector("#exercise-total");
const proteinTotalEl = document.querySelector("#protein-total");
const carbsTotalEl = document.querySelector("#carbs-total");
const fatTotalEl = document.querySelector("#fat-total");
const foodListEl = document.querySelector("#food-list");
const emptyStateEl = document.querySelector("#empty-state");
const exerciseListEl = document.querySelector("#exercise-list");
const exerciseEmptyStateEl = document.querySelector("#exercise-empty-state");
const mealForm = document.querySelector("#meal-form");
const macroSearchInput = document.querySelector("#macro-search");
const macroSearchButton = document.querySelector("#macro-search-button");
const macroAnswerEl = document.querySelector("#macro-answer");
const useMacroAnswerButton = document.querySelector("#use-macro-answer");
const exerciseForm = document.querySelector("#exercise-form");
const mealSubmitButton = document.querySelector("#meal-submit");
const exerciseSubmitButton = document.querySelector("#exercise-submit");
const goalForm = document.querySelector("#goal-form");
const goalInput = document.querySelector("#goal-input");
const proteinGoalInput = document.querySelector("#protein-goal");
const carbsGoalInput = document.querySelector("#carbs-goal");
const fatGoalInput = document.querySelector("#fat-goal");
const clearLogButton = document.querySelector("#clear-log");
const clearExerciseLogButton = document.querySelector("#clear-exercise-log");
const viewTabsEl = document.querySelector(".view-tabs");
const viewButtons = document.querySelectorAll(".tab-button");
const viewPanels = document.querySelectorAll(".view-panel");
const calendarGridEl = document.querySelector("#calendar-grid");
const historyMonthEl = document.querySelector("#history-month");
const previousMonthButton = document.querySelector("#previous-month");
const nextMonthButton = document.querySelector("#next-month");
const dayDetailEl = document.querySelector("#day-detail");
const editDayFoodButton = document.querySelector("#edit-day-food");
const editDayWorkoutButton = document.querySelector("#edit-day-workout");
const workoutAiForm = document.querySelector("#workout-ai-form");
const workoutPlanEl = document.querySelector("#workout-plan");
const logGeneratedWorkoutButton = document.querySelector("#log-generated-workout");
const regenerateWorkoutButton = document.querySelector("#regenerate-workout");
const profileForm = document.querySelector("#profile-form");
const profileNameInput = document.querySelector("#profile-name");
const profileHeightInput = document.querySelector("#profile-height");
const profileCurrentWeightInput = document.querySelector("#profile-current-weight");
const profileGoalWeightInput = document.querySelector("#profile-goal-weight");
const healthDiaryInput = document.querySelector("#health-diary");

if (viewTabsEl) {
  viewTabsEl.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest(".tab-button");

    if (!button) {
      return;
    }

    switchView(button.dataset.view);
  });
}

let state = loadState();
let selectedDateKey = getTodayKey();
let visibleHistoryDate = new Date();
let latestMacroEstimate = null;
let latestWorkoutPlan = null;
let latestWorkoutRequest = null;
let workoutVariation = 0;
let editingFoodId = null;
let editingExerciseId = null;

const macroEstimates = [
  { keywords: ["banana"], name: "banana", serving: "1 medium banana", calories: 105, protein: 1, carbs: 27, fat: 0 },
  { keywords: ["chicken", "chicken breast"], name: "chicken breast", serving: "4 oz cooked chicken breast", calories: 185, protein: 35, carbs: 0, fat: 4 },
  { keywords: ["brown rice"], name: "brown rice", serving: "1 cup cooked brown rice", calories: 216, protein: 5, carbs: 45, fat: 2 },
  { keywords: ["rice", "white rice"], name: "white rice", serving: "1 cup cooked white rice", calories: 205, protein: 4, carbs: 45, fat: 0 },
  { keywords: ["egg", "eggs"], name: "egg", serving: "1 large egg", calories: 72, protein: 6, carbs: 0, fat: 5 },
  { keywords: ["oatmeal", "oats"], name: "oatmeal", serving: "1 cup cooked oatmeal", calories: 154, protein: 6, carbs: 27, fat: 3 },
  { keywords: ["apple"], name: "apple", serving: "1 medium apple", calories: 95, protein: 1, carbs: 25, fat: 0 },
  { keywords: ["salmon"], name: "salmon", serving: "4 oz cooked salmon", calories: 233, protein: 25, carbs: 0, fat: 14 },
  { keywords: ["greek yogurt", "yogurt"], name: "Greek yogurt", serving: "1 cup plain nonfat Greek yogurt", calories: 130, protein: 23, carbs: 9, fat: 0 },
  { keywords: ["avocado"], name: "avocado", serving: "1/2 medium avocado", calories: 120, protein: 2, carbs: 6, fat: 11 },
];

function loadState() {
  const savedState = localStorage.getItem(storageKey);
  const today = getDateKey(new Date());

  if (!savedState) {
    return {
      goal: DEFAULT_GOAL,
      foods: [],
      exercises: [],
      profile: {},
      diary: {},
      macroGoals: calculateMacroGoals(DEFAULT_GOAL),
      macroGoalsCustom: false,
    };
  }

  try {
    const parsedState = JSON.parse(savedState);
    return {
      goal: Number(parsedState.goal) || DEFAULT_GOAL,
      foods: normalizeEntries(parsedState.foods, today),
      exercises: normalizeEntries(parsedState.exercises, today),
      profile: parsedState.profile && typeof parsedState.profile === "object" ? parsedState.profile : {},
      diary: parsedState.diary && typeof parsedState.diary === "object" ? parsedState.diary : {},
      macroGoals: normalizeMacroGoals(parsedState.macroGoals, Number(parsedState.goal) || DEFAULT_GOAL),
      macroGoalsCustom: Boolean(parsedState.macroGoalsCustom),
    };
  } catch {
    return {
      goal: DEFAULT_GOAL,
      foods: [],
      exercises: [],
      profile: {},
      diary: {},
      macroGoals: calculateMacroGoals(DEFAULT_GOAL),
      macroGoalsCustom: false,
    };
  }
}

function normalizeEntries(entries, fallbackDate) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.map((entry) => ({
    ...entry,
    date: entry.date || fallbackDate,
  }));
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCalories(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function calculateMacroGoals(calorieGoal) {
  return {
    protein: Math.round((calorieGoal * 0.3) / 4),
    carbs: Math.round((calorieGoal * 0.4) / 4),
    fat: Math.round((calorieGoal * 0.3) / 9),
  };
}

function normalizeMacroGoals(macroGoals, calorieGoal) {
  const calculatedGoals = calculateMacroGoals(calorieGoal);

  if (!macroGoals || typeof macroGoals !== "object") {
    return calculatedGoals;
  }

  const normalizedGoals = {
    protein: Number.isFinite(Number(macroGoals.protein)) ? Number(macroGoals.protein) : calculatedGoals.protein,
    carbs: Number.isFinite(Number(macroGoals.carbs)) ? Number(macroGoals.carbs) : calculatedGoals.carbs,
    fat: Number.isFinite(Number(macroGoals.fat)) ? Number(macroGoals.fat) : calculatedGoals.fat,
  };

  if (normalizedGoals.protein === 0 && normalizedGoals.carbs === 0 && normalizedGoals.fat === 0) {
    return calculatedGoals;
  }

  return normalizedGoals;
}

function getMacroGoalValue(inputValue, fallbackValue) {
  if (String(inputValue).trim() === "") {
    return fallbackValue;
  }

  const value = Number(inputValue);
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : fallbackValue;
}

function goalsMatchCalculated(macroGoals, calculatedGoals) {
  return macroGoals.protein === calculatedGoals.protein
    && macroGoals.carbs === calculatedGoals.carbs
    && macroGoals.fat === calculatedGoals.fat;
}

function fillCalculatedMacroGoals(calorieGoal) {
  const calculatedGoals = calculateMacroGoals(calorieGoal);
  proteinGoalInput.value = calculatedGoals.protein;
  carbsGoalInput.value = calculatedGoals.carbs;
  fatGoalInput.value = calculatedGoals.fat;
}

function getTodayKey() {
  return getDateKey(new Date());
}

function getSelectedDate() {
  return new Date(`${selectedDateKey}T00:00:00`);
}

function formatDisplayDate(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  const dateText = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (dateKey === getTodayKey()) {
    return `Today, ${dateText}`;
  }

  return dateText;
}

function getFoodsForDate(dateKey) {
  return state.foods.filter((food) => food.date === dateKey);
}

function getExercisesForDate(dateKey) {
  return state.exercises.filter((exercise) => exercise.date === dateKey);
}

function getTotalCalories(foods = getFoodsForDate(getTodayKey())) {
  return foods.reduce((total, food) => total + food.calories, 0);
}

function getExerciseCalories(exercises = getExercisesForDate(getTodayKey())) {
  return exercises.reduce((total, exercise) => total + exercise.calories, 0);
}

function getMacroTotals(foods = getFoodsForDate(getTodayKey())) {
  return foods.reduce(
    (totals, food) => {
      totals.protein += Number(food.protein) || 0;
      totals.carbs += Number(food.carbs) || 0;
      totals.fat += Number(food.fat) || 0;
      return totals;
    },
    { protein: 0, carbs: 0, fat: 0 },
  );
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderSummary() {
  const selectedFoods = getFoodsForDate(selectedDateKey);
  const selectedExercises = getExercisesForDate(selectedDateKey);
  const totalCalories = getTotalCalories(selectedFoods);
  const exerciseCalories = getExerciseCalories(selectedExercises);
  const macros = getMacroTotals(selectedFoods);
  const netCalories = Math.max(totalCalories - exerciseCalories, 0);
  const remainingCalories = state.goal - netCalories;
  const progressPercent = Math.min((netCalories / state.goal) * 100, 100);

  document.querySelector("#app-title").textContent = formatDisplayDate(selectedDateKey);
  caloriesEatenEl.textContent = formatCalories(netCalories);
  foodTotalEl.textContent = formatCalories(totalCalories);
  exerciseTotalEl.textContent = formatCalories(exerciseCalories);
  proteinTotalEl.textContent = `${formatCalories(macros.protein)}g / ${formatCalories(Number(state.macroGoals.protein) || 0)}g`;
  carbsTotalEl.textContent = `${formatCalories(macros.carbs)}g / ${formatCalories(Number(state.macroGoals.carbs) || 0)}g`;
  fatTotalEl.textContent = `${formatCalories(macros.fat)}g / ${formatCalories(Number(state.macroGoals.fat) || 0)}g`;
  goalLabelEl.textContent = `Goal: ${formatCalories(state.goal)}`;
  progressBarEl.style.width = `${progressPercent}%`;

  if (remainingCalories >= 0) {
    remainingCaloriesEl.textContent = `${formatCalories(remainingCalories)} left`;
    return;
  }

  remainingCaloriesEl.textContent = `${formatCalories(Math.abs(remainingCalories))} over`;
}

function renderFoodList() {
  const selectedFoods = getFoodsForDate(selectedDateKey);

  foodListEl.innerHTML = "";
  emptyStateEl.hidden = selectedFoods.length > 0;

  selectedFoods.forEach((food) => {
    const item = document.createElement("li");
    item.className = "food-item";

    const name = document.createElement("span");
    name.className = "food-name";
    name.textContent = food.name;

    const macroNote = document.createElement("span");
    macroNote.className = "macro-note";
    macroNote.textContent = `P ${formatCalories(Number(food.protein) || 0)}g / C ${formatCalories(Number(food.carbs) || 0)}g / F ${formatCalories(Number(food.fat) || 0)}g`;

    const calories = document.createElement("span");
    calories.className = "food-calories";
    calories.textContent = `${formatCalories(food.calories)} cal`;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "x";
    deleteButton.setAttribute("aria-label", `Remove ${food.name}`);
    deleteButton.addEventListener("click", () => deleteFood(food.id));

    const editButton = document.createElement("button");
    editButton.className = "ghost-button small-button";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editFood(food.id));

    const actions = document.createElement("span");
    actions.className = "item-actions";
    actions.append(editButton, deleteButton);

    const details = document.createElement("span");
    details.append(name, macroNote);

    item.append(details, calories, actions);
    foodListEl.append(item);
  });
}

function renderExerciseList() {
  const selectedExercises = getExercisesForDate(selectedDateKey);

  exerciseListEl.innerHTML = "";
  exerciseEmptyStateEl.hidden = selectedExercises.length > 0;

  selectedExercises.forEach((exercise) => {
    const item = document.createElement("li");
    item.className = "food-item";

    const details = document.createElement("span");

    const name = document.createElement("span");
    name.className = "food-name";
    name.textContent = `${exercise.type}: ${exercise.name}`;

    details.append(name);

    if (exercise.note) {
      const note = document.createElement("span");
      note.className = "food-note";
      note.textContent = exercise.note;
      details.append(note);
    }

    const calories = document.createElement("span");
    calories.className = "food-calories";
    calories.textContent = `${formatCalories(exercise.calories)} burned`;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "x";
    deleteButton.setAttribute("aria-label", `Remove ${exercise.name}`);
    deleteButton.addEventListener("click", () => deleteExercise(exercise.id));

    const editButton = document.createElement("button");
    editButton.className = "ghost-button small-button";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editExercise(exercise.id));

    const actions = document.createElement("span");
    actions.className = "item-actions";
    actions.append(editButton, deleteButton);

    item.append(details, calories, actions);
    exerciseListEl.append(item);
  });
}

function renderCalendar() {
  const year = visibleHistoryDate.getFullYear();
  const month = visibleHistoryDate.getMonth();
  const monthName = visibleHistoryDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const todayKey = getTodayKey();

  historyMonthEl.textContent = monthName;
  calendarGridEl.innerHTML = "";

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    const emptyDay = document.createElement("div");
    emptyDay.className = "calendar-day empty";
    calendarGridEl.append(emptyDay);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = new Date(year, month, day);
    const dateKey = getDateKey(date);
    const foods = getFoodsForDate(dateKey);
    const exercises = getExercisesForDate(dateKey);
    const eaten = getTotalCalories(foods);
    const burned = getExerciseCalories(exercises);
    const net = Math.max(eaten - burned, 0);

    const dayCard = document.createElement("div");
    dayCard.type = "button";
    dayCard.className = "calendar-day";
    dayCard.classList.toggle("today", dateKey === todayKey);
    dayCard.classList.toggle("selected", dateKey === selectedDateKey);
    dayCard.setAttribute("role", "button");
    dayCard.setAttribute("tabindex", "0");
    dayCard.setAttribute("aria-label", `View ${date.toLocaleDateString("en-US")}`);

    const dateLabel = document.createElement("span");
    dateLabel.className = "calendar-date";
    dateLabel.textContent = String(day);

    const netLabel = document.createElement("span");
    netLabel.className = "calendar-metric net";
    netLabel.textContent = `${formatCalories(net)} net`;

    const eatenLabel = document.createElement("span");
    eatenLabel.className = "calendar-metric";
    eatenLabel.textContent = `${formatCalories(eaten)} eaten`;

    const burnedLabel = document.createElement("span");
    burnedLabel.className = "calendar-metric";
    burnedLabel.textContent = `${formatCalories(burned)} burned`;

    dayCard.append(dateLabel, netLabel, eatenLabel, burnedLabel);
    dayCard.addEventListener("click", () => selectDate(dateKey));
    dayCard.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectDate(dateKey);
      }
    });
    calendarGridEl.append(dayCard);
  }
}

function renderDayDetail() {
  const foods = getFoodsForDate(selectedDateKey);
  const exercises = getExercisesForDate(selectedDateKey);
  const detailTitle = document.createElement("p");
  detailTitle.className = "detail-date";
  detailTitle.textContent = formatDisplayDate(selectedDateKey);

  dayDetailEl.innerHTML = "";
  dayDetailEl.append(detailTitle);

  const foodHeading = document.createElement("strong");
  foodHeading.textContent = "Food";
  dayDetailEl.append(foodHeading);

  if (foods.length === 0) {
    const emptyFood = document.createElement("p");
    emptyFood.className = "empty-state";
    emptyFood.textContent = "No food logged.";
    dayDetailEl.append(emptyFood);
  } else {
    foods.forEach((food) => {
      const item = document.createElement("p");
      item.className = "detail-line";
      item.textContent = `${food.name}: ${formatCalories(food.calories)} cal, P ${food.protein || 0}g / C ${food.carbs || 0}g / F ${food.fat || 0}g`;
      dayDetailEl.append(item);
    });
  }

  const diaryHeading = document.createElement("strong");
  diaryHeading.textContent = "Health diary";
  dayDetailEl.append(diaryHeading);

  const diaryText = document.createElement("p");
  diaryText.className = state.diary[selectedDateKey] ? "detail-line" : "empty-state";
  diaryText.textContent = state.diary[selectedDateKey] || "No diary entry.";
  dayDetailEl.append(diaryText);

  const workoutHeading = document.createElement("strong");
  workoutHeading.textContent = "Workout";
  dayDetailEl.append(workoutHeading);

  if (exercises.length === 0) {
    const emptyWorkout = document.createElement("p");
    emptyWorkout.className = "empty-state";
    emptyWorkout.textContent = "No workout logged.";
    dayDetailEl.append(emptyWorkout);
    return;
  }

  exercises.forEach((exercise) => {
    const item = document.createElement("p");
    item.className = "detail-line";
    item.textContent = `${exercise.type}: ${exercise.name}, ${formatCalories(exercise.calories)} burned${exercise.note ? ` - ${exercise.note}` : ""}`;
    dayDetailEl.append(item);
  });
}

function renderProfile() {
  profileNameInput.value = state.profile.name || "";
  profileHeightInput.value = state.profile.height || "";
  profileCurrentWeightInput.value = state.profile.currentWeight || "";
  profileGoalWeightInput.value = state.profile.goalWeight || "";
  healthDiaryInput.value = state.diary[selectedDateKey] || "";
}

function render() {
  goalInput.value = state.goal;
  proteinGoalInput.value = state.macroGoals.protein || 0;
  carbsGoalInput.value = state.macroGoals.carbs || 0;
  fatGoalInput.value = state.macroGoals.fat || 0;
  mealSubmitButton.textContent = editingFoodId ? "Save food" : "Add food";
  exerciseSubmitButton.textContent = editingExerciseId ? "Save exercise" : "Add exercise";
  renderSummary();
  renderFoodList();
  renderExerciseList();
  renderCalendar();
  renderDayDetail();
  renderProfile();
}

function addFood(name, calories, protein, carbs, fat) {
  if (editingFoodId) {
    state.foods = state.foods.map((food) =>
      food.id === editingFoodId
        ? { ...food, name, calories, protein, carbs, fat, date: selectedDateKey }
        : food,
    );
    editingFoodId = null;
    saveState();
    render();
    return;
  }

  state.foods.unshift({
    id: createId(),
    name,
    calories,
    protein,
    carbs,
    fat,
    date: selectedDateKey,
  });
  saveState();
  render();
}

function addExercise(type, name, note, calories) {
  if (editingExerciseId) {
    state.exercises = state.exercises.map((exercise) =>
      exercise.id === editingExerciseId
        ? { ...exercise, type, name, note, calories, date: selectedDateKey }
        : exercise,
    );
    editingExerciseId = null;
    saveState();
    render();
    return;
  }

  state.exercises.unshift({
    id: createId(),
    type,
    name,
    note,
    calories,
    date: selectedDateKey,
  });
  saveState();
  render();
}

function deleteFood(foodId) {
  state.foods = state.foods.filter((food) => food.id !== foodId);
  if (editingFoodId === foodId) {
    editingFoodId = null;
    mealForm.reset();
  }
  saveState();
  render();
}

function deleteExercise(exerciseId) {
  state.exercises = state.exercises.filter((exercise) => exercise.id !== exerciseId);
  if (editingExerciseId === exerciseId) {
    editingExerciseId = null;
    exerciseForm.reset();
  }
  saveState();
  render();
}

function editFood(foodId) {
  const food = state.foods.find((item) => item.id === foodId);

  if (!food) {
    return;
  }

  editingFoodId = foodId;
  document.querySelector("#food-name").value = food.name;
  document.querySelector("#food-calories").value = food.calories;
  document.querySelector("#food-protein").value = food.protein || 0;
  document.querySelector("#food-carbs").value = food.carbs || 0;
  document.querySelector("#food-fat").value = food.fat || 0;
  render();
  document.querySelector("#food-name").focus();
}

function editExercise(exerciseId) {
  const exercise = state.exercises.find((item) => item.id === exerciseId);

  if (!exercise) {
    return;
  }

  editingExerciseId = exerciseId;
  document.querySelector("#exercise-type").value = exercise.type;
  document.querySelector("#workout-name").value = exercise.name;
  document.querySelector("#exercise-note").value = exercise.note || "";
  document.querySelector("#exercise-calories").value = exercise.calories;
  render();
  document.querySelector("#workout-name").focus();
}

mealForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(mealForm);
  const name = document.querySelector("#food-name").value.trim();
  const calories = Number(formData.get("food-calories"));
  const protein = Number(formData.get("food-protein")) || 0;
  const carbs = Number(formData.get("food-carbs")) || 0;
  const fat = Number(formData.get("food-fat")) || 0;

  if (!name || calories <= 0) {
    return;
  }

  addFood(name, Math.round(calories), Math.round(protein), Math.round(carbs), Math.round(fat));
  mealForm.reset();
  editingFoodId = null;
  document.querySelector("#food-name").focus();
});

exerciseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(exerciseForm);
  const type = formData.get("exercise-type");
  const name = String(formData.get("workout-name")).trim();
  const note = String(formData.get("exercise-note")).trim();
  const calories = Number(formData.get("exercise-calories"));

  if (!type || !name || calories <= 0) {
    return;
  }

  addExercise(type, name, note, Math.round(calories));
  exerciseForm.reset();
  editingExerciseId = null;
  document.querySelector("#workout-name").focus();
});

goalForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const goal = Number(goalInput.value);
  if (goal <= 0) {
    return;
  }

  state.goal = Math.round(goal);
  const calculatedGoals = calculateMacroGoals(state.goal);
  state.macroGoals = {
    protein: getMacroGoalValue(proteinGoalInput.value, calculatedGoals.protein),
    carbs: getMacroGoalValue(carbsGoalInput.value, calculatedGoals.carbs),
    fat: getMacroGoalValue(fatGoalInput.value, calculatedGoals.fat),
  };
  state.macroGoalsCustom = !goalsMatchCalculated(state.macroGoals, calculatedGoals);
  saveState();
  render();
});

goalInput.addEventListener("input", () => {
  const goal = Number(goalInput.value);

  if (goal > 0 && !state.macroGoalsCustom) {
    fillCalculatedMacroGoals(Math.round(goal));
  }
});

[proteinGoalInput, carbsGoalInput, fatGoalInput].forEach((input) => {
  input.addEventListener("input", () => {
    state.macroGoals = {
      protein: getMacroGoalValue(proteinGoalInput.value, 0),
      carbs: getMacroGoalValue(carbsGoalInput.value, 0),
      fat: getMacroGoalValue(fatGoalInput.value, 0),
    };
    state.macroGoalsCustom = true;
    saveState();
    renderSummary();
  });
});

clearLogButton.addEventListener("click", () => {
  state.foods = state.foods.filter((food) => food.date !== selectedDateKey);
  editingFoodId = null;
  mealForm.reset();
  saveState();
  render();
});

clearExerciseLogButton.addEventListener("click", () => {
  state.exercises = state.exercises.filter((exercise) => exercise.date !== selectedDateKey);
  editingExerciseId = null;
  exerciseForm.reset();
  saveState();
  render();
});

function getMacroEstimate(searchTerm) {
  const normalizedTerm = searchTerm.toLowerCase();
  const exactMatch = macroEstimates.find((estimate) =>
    estimate.keywords.some((keyword) => normalizedTerm.includes(keyword)),
  );

  if (exactMatch) {
    return exactMatch;
  }

  return {
    name: searchTerm,
    serving: "1 typical serving",
    calories: 150,
    protein: 5,
    carbs: 20,
    fat: 5,
    isFallback: true,
  };
}

function askMacroHelper() {
  const searchTerm = macroSearchInput.value.trim() || document.querySelector("#food-name").value.trim();

  if (!searchTerm) {
    macroAnswerEl.innerHTML = "<strong>AI macro helper</strong><p>Type a food first, like banana or chicken breast.</p>";
    useMacroAnswerButton.hidden = true;
    latestMacroEstimate = null;
    return;
  }

  latestMacroEstimate = getMacroEstimate(searchTerm);
  macroAnswerEl.innerHTML = `
    <strong>${latestMacroEstimate.name}</strong>
    <p>${latestMacroEstimate.serving}: ${latestMacroEstimate.calories} calories, ${latestMacroEstimate.protein}g protein, ${latestMacroEstimate.carbs}g carbs, ${latestMacroEstimate.fat}g fat.</p>
    <small>${latestMacroEstimate.isFallback ? "This is a rough estimate. Adjust it if your serving is different." : "Estimate based on a common serving size."}</small>
  `;
  useMacroAnswerButton.hidden = false;
}

function useMacroEstimate() {
  if (!latestMacroEstimate) {
    return;
  }

  document.querySelector("#food-name").value = latestMacroEstimate.name;
  document.querySelector("#food-calories").value = latestMacroEstimate.calories;
  document.querySelector("#food-protein").value = latestMacroEstimate.protein;
  document.querySelector("#food-carbs").value = latestMacroEstimate.carbs;
  document.querySelector("#food-fat").value = latestMacroEstimate.fat;
}

function getWorkoutMoves(style, location, focus) {
  const fullCardio = ["high knees", "jumping jacks", "mountain climbers", "speed skaters"];
  const upperCardio = ["shadow boxing punches", "plank shoulder taps", "battle rope waves", "ski erg pulls"];
  const lowerCardio = ["speed skaters", "squat jumps", "lateral lunges", "fast step-ups"];
  const equipmentCardio = ["treadmill run", "bike calories", "rower meters", "elliptical push"];
  const upperEquipmentCardio = ["ski erg pulls", "battle rope waves", "arm bike calories", "medicine ball slams"];
  const lowerEquipmentCardio = ["treadmill incline walk", "bike calories", "stair climber", "sled push"];
  const upperWeights = ["dumbbell press", "lat pulldown or rows", "shoulder press", "biceps curls", "triceps pressdowns"];
  const lowerWeights = ["goblet squats", "Romanian deadlifts", "walking lunges", "leg press", "calf raises"];
  const fullWeights = ["squats", "rows", "bench press or push-ups", "deadlifts", "plank holds"];
  const homeStrength = focus === "Lower body"
    ? ["bodyweight squats", "reverse lunges", "glute bridges", "wall sit"]
    : focus === "Upper body"
      ? ["push-ups", "plank shoulder taps", "pike push-ups", "supermans"]
      : ["squats", "push-ups", "reverse lunges", "plank holds"];
  const homeCardio = focus === "Upper body" ? upperCardio : focus === "Lower body" ? lowerCardio : fullCardio;
  const focusedEquipmentCardio = focus === "Upper body"
    ? upperEquipmentCardio
    : focus === "Lower body"
      ? lowerEquipmentCardio
      : equipmentCardio;

  if (style === "Cardio") {
    return location === "Home" || location === "Gym weights" ? homeCardio : focusedEquipmentCardio;
  }

  if (style === "Weight lifting") {
    if (location === "Home") {
      return homeStrength;
    }
    if (focus === "Upper body") {
      return upperWeights;
    }
    if (focus === "Lower body") {
      return lowerWeights;
    }
    return fullWeights;
  }

  const cardioMoves = location === "Home" || location === "Gym weights" ? homeCardio : focusedEquipmentCardio;
  const strengthMoves = location === "Home"
    ? homeStrength
    : focus === "Upper body"
      ? upperWeights
      : focus === "Lower body"
        ? lowerWeights
        : fullWeights;

  return [cardioMoves[0], strengthMoves[0], cardioMoves[1], strengthMoves[1], strengthMoves[2]];
}

function buildWorkoutPlan({ targetBurn, minutes, location, style, focus }) {
  const warmupMinutes = Math.max(3, Math.min(6, Math.round(minutes * 0.12)));
  const cooldownMinutes = Math.max(2, Math.min(5, Math.round(minutes * 0.08)));
  const workMinutes = Math.max(5, minutes - warmupMinutes - cooldownMinutes);
  const baseMoves = getWorkoutMoves(style, location, focus);
  const rotation = workoutVariation % baseMoves.length;
  const moves = [...baseMoves.slice(rotation), ...baseMoves.slice(0, rotation)];
  const intensity = targetBurn / minutes >= 11 ? "hard" : targetBurn / minutes >= 7 ? "moderate" : "steady";
  const formats = ["circuit", "AMRAP", "strength circuit", "conditioning circuit"];
  const format = formats[workoutVariation % formats.length];
  const movementCount = minutes <= 20 ? 4 : 5;
  const repBase = intensity === "hard" ? 14 : intensity === "moderate" ? 12 : 10;
  const selectedMoves = moves.slice(0, movementCount);
  const estimatedSecondsPerMove = style === "Cardio" ? 35 : 45;
  const restSeconds = intensity === "hard" ? 30 : 45;
  const estimatedRoundSeconds = (selectedMoves.length * estimatedSecondsPerMove) + restSeconds;
  const rounds = Math.max(3, Math.min(7, Math.floor((workMinutes * 60) / estimatedRoundSeconds)));
  const roundWindow = Math.max(3, Math.round(estimatedRoundSeconds / 60));
  const prescriptions = selectedMoves.map((move, index) => {
    const reps = repBase + (index % 2 === 0 ? 0 : 2);

    if (move.includes("rower")) {
      return `${move}: 250 meters`;
    }
    if (move.includes("bike")) {
      return `${move}: ${intensity === "hard" ? 12 : 9} calories`;
    }
    if (move.includes("treadmill") || move.includes("elliptical")) {
      return `${move}: ${intensity === "hard" ? 60 : 45} seconds`;
    }

    return `${move}: ${reps} reps`;
  });
  const mainWork = format === "AMRAP"
    ? [
        `${workMinutes}-minute AMRAP: complete as many quality rounds as possible at a timely, controlled pace.`,
        ...prescriptions,
        "Rest only as needed; a generally fit pace should keep rounds moving without long breaks.",
      ]
    : [
        `${rounds} rounds for quality, aiming for about ${roundWindow} minutes per round.`,
        ...prescriptions,
        `Rest ${restSeconds} seconds between rounds.`,
      ];

  return {
    title: `${minutes}-minute ${format} ${focus.toLowerCase()} ${style.toLowerCase()} workout`,
    type: style === "Weight lifting" ? "Weightlifting" : style,
    calories: targetBurn,
    note: `${location}; ${style}; ${focus}; ${minutes} minutes; target ${targetBurn} calories`,
    steps: [
      `${warmupMinutes} min warm-up: easy movement and mobility.`,
      ...mainWork,
      `${cooldownMinutes} min cool-down: slow pace and stretching.`,
    ],
  };
}

function renderWorkoutPlan(plan) {
  workoutPlanEl.innerHTML = "";

  const title = document.createElement("strong");
  title.textContent = plan.title;

  const summary = document.createElement("p");
  summary.textContent = `Target: ${formatCalories(plan.calories)} calories. ${plan.note}.`;

  const list = document.createElement("ol");
  list.className = "plan-list";
  plan.steps.forEach((step) => {
    const item = document.createElement("li");
    item.textContent = step;
    list.append(item);
  });

  const reminder = document.createElement("small");
  reminder.textContent = "Adjust pace, rest, and weight to match your fitness level.";

  workoutPlanEl.append(title, summary, list, reminder);
  logGeneratedWorkoutButton.hidden = false;
  regenerateWorkoutButton.hidden = false;
}

macroSearchButton.addEventListener("click", askMacroHelper);
macroSearchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    askMacroHelper();
  }
});
useMacroAnswerButton.addEventListener("click", useMacroEstimate);

profileForm.addEventListener("input", () => {
  state.profile = {
    name: profileNameInput.value.trim(),
    height: profileHeightInput.value.trim(),
    currentWeight: profileCurrentWeightInput.value,
    goalWeight: profileGoalWeightInput.value,
  };
  state.diary[selectedDateKey] = healthDiaryInput.value.trim();
  saveState();
});

workoutAiForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(workoutAiForm);
  const targetBurn = Number(formData.get("target-burn"));
  const minutes = Number(formData.get("workout-minutes"));
  const location = formData.get("workout-location");
  const style = formData.get("workout-style");
  const focus = formData.get("body-focus");

  if (targetBurn <= 0 || minutes <= 0 || !location || !style || !focus) {
    return;
  }

  workoutVariation = 0;
  latestWorkoutRequest = {
    targetBurn: Math.round(targetBurn),
    minutes: Math.round(minutes),
    location,
    style,
    focus,
  };
  latestWorkoutPlan = buildWorkoutPlan(latestWorkoutRequest);
  renderWorkoutPlan(latestWorkoutPlan);
});

regenerateWorkoutButton.addEventListener("click", () => {
  if (!latestWorkoutRequest) {
    return;
  }

  workoutVariation += 1;
  latestWorkoutPlan = buildWorkoutPlan(latestWorkoutRequest);
  renderWorkoutPlan(latestWorkoutPlan);
});

logGeneratedWorkoutButton.addEventListener("click", () => {
  if (!latestWorkoutPlan) {
    return;
  }

  addExercise(latestWorkoutPlan.type, latestWorkoutPlan.title, latestWorkoutPlan.steps.join(" "), latestWorkoutPlan.calories);
  switchView("workout");
});

previousMonthButton.addEventListener("click", () => {
  visibleHistoryDate = new Date(visibleHistoryDate.getFullYear(), visibleHistoryDate.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthButton.addEventListener("click", () => {
  visibleHistoryDate = new Date(visibleHistoryDate.getFullYear(), visibleHistoryDate.getMonth() + 1, 1);
  renderCalendar();
});

function switchView(selectedView) {
  if (!selectedView) {
    return;
  }

  const selectedPanelId = `${selectedView}-view`;

  viewButtons.forEach((viewButton) => {
    const isActive = viewButton.dataset.view === selectedView;
    viewButton.classList.toggle("active", isActive);
    viewButton.setAttribute("aria-selected", String(isActive));
  });

  viewPanels.forEach((panel) => {
    const isActive = panel.id === selectedPanelId;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });
}

function selectDate(dateKey) {
  selectedDateKey = dateKey;
  visibleHistoryDate = getSelectedDate();
  render();
}

editDayFoodButton.addEventListener("click", () => switchView("food"));
editDayWorkoutButton.addEventListener("click", () => switchView("workout"));

render();
