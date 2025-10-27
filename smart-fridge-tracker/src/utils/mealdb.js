// src/utils/mealdb.js
export async function fetchMealsByIngredients(ingredientsCsv) {
  const url = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredientsCsv)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('MealDB filter request failed');
  const json = await res.json();
  return json.meals || [];
}

export async function fetchMealDetail(idMeal) {
  const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(idMeal)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('MealDB lookup request failed');
  const json = await res.json();
  return (json.meals && json.meals[0]) || null;
}
