export interface Food {
  id: string;
  name: string;
  unit: string;
  perUnit: { calories: number; protein: number; carbs: number; fat: number };
  category: "protein" | "carb" | "fat" | "shake" | "meal" | "snack";
  emoji: string;
}

export const FOODS: Food[] = [
  // חלבונים
  { id: "chicken", name: "חזה עוף", unit: "100 ג'", perUnit: { calories: 165, protein: 31, carbs: 0, fat: 3.6 }, category: "protein", emoji: "🍗" },
  { id: "tuna_can", name: "טונה בקופסה", unit: "קופסה (140 ג')", perUnit: { calories: 130, protein: 28, carbs: 0, fat: 1 }, category: "protein", emoji: "🐟" },
  { id: "egg_l", name: "ביצה L", unit: "ביצה", perUnit: { calories: 80, protein: 7, carbs: 0.4, fat: 5.5 }, category: "protein", emoji: "🥚" },
  { id: "cottage_5", name: "קוטג' 5%", unit: "250 ג'", perUnit: { calories: 200, protein: 28, carbs: 6, fat: 12.5 }, category: "protein", emoji: "🧀" },
  { id: "greek_yogurt", name: "יוגורט יווני 0%", unit: "150 ג'", perUnit: { calories: 90, protein: 16, carbs: 5, fat: 0 }, category: "protein", emoji: "🥛" },
  { id: "beef_lean", name: "בקר רזה", unit: "100 ג'", perUnit: { calories: 170, protein: 26, carbs: 0, fat: 7 }, category: "protein", emoji: "🥩" },
  { id: "salmon", name: "סלמון", unit: "100 ג'", perUnit: { calories: 208, protein: 22, carbs: 0, fat: 13 }, category: "protein", emoji: "🐠" },

  // פחמימות
  { id: "rice", name: "אורז לבן מבושל", unit: "100 ג'", perUnit: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 }, category: "carb", emoji: "🍚" },
  { id: "rice_brown", name: "אורז מלא מבושל", unit: "100 ג'", perUnit: { calories: 112, protein: 2.6, carbs: 23, fat: 0.9 }, category: "carb", emoji: "🍚" },
  { id: "bread_dark", name: "פרוסת לחם מלא", unit: "פרוסה", perUnit: { calories: 80, protein: 4, carbs: 14, fat: 1 }, category: "carb", emoji: "🍞" },
  { id: "oats", name: "שיבולת שועל", unit: "50 ג' יבש", perUnit: { calories: 190, protein: 6.5, carbs: 33, fat: 3.5 }, category: "carb", emoji: "🥣" },
  { id: "potato", name: "תפו\"א אפוי", unit: "100 ג'", perUnit: { calories: 95, protein: 2.5, carbs: 22, fat: 0.1 }, category: "carb", emoji: "🥔" },
  { id: "pasta", name: "פסטה מבושלת", unit: "100 ג'", perUnit: { calories: 130, protein: 5, carbs: 25, fat: 1 }, category: "carb", emoji: "🍝" },
  { id: "banana", name: "בננה", unit: "בינונית", perUnit: { calories: 105, protein: 1.3, carbs: 27, fat: 0.4 }, category: "carb", emoji: "🍌" },
  { id: "apple", name: "תפוח", unit: "בינוני", perUnit: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 }, category: "carb", emoji: "🍎" },

  // שומנים
  { id: "olive_oil", name: "שמן זית", unit: "כף", perUnit: { calories: 120, protein: 0, carbs: 0, fat: 14 }, category: "fat", emoji: "🫒" },
  { id: "avocado", name: "אבוקדו", unit: "חצי", perUnit: { calories: 160, protein: 2, carbs: 9, fat: 15 }, category: "fat", emoji: "🥑" },
  { id: "almonds", name: "שקדים", unit: "כף (15 ג')", perUnit: { calories: 90, protein: 3, carbs: 3, fat: 8 }, category: "fat", emoji: "🌰" },
  { id: "peanut_butter", name: "חמאת בוטנים", unit: "כף", perUnit: { calories: 95, protein: 3.5, carbs: 3, fat: 8 }, category: "fat", emoji: "🥜" },
  { id: "tahini", name: "טחינה גולמית", unit: "כף", perUnit: { calories: 90, protein: 3, carbs: 3, fat: 8 }, category: "fat", emoji: "🫙" },

  // שייקים / תוספים
  { id: "iso100", name: "Dymatize ISO100", unit: "מנה (32 ג')", perUnit: { calories: 120, protein: 25, carbs: 2, fat: 0.5 }, category: "shake", emoji: "💪" },
  { id: "milk_3", name: "חלב 3%", unit: "כוס (240 מ\"ל)", perUnit: { calories: 150, protein: 8, carbs: 12, fat: 8 }, category: "shake", emoji: "🥛" },
  { id: "milk_1", name: "חלב 1%", unit: "כוס (240 מ\"ל)", perUnit: { calories: 100, protein: 8, carbs: 12, fat: 2.5 }, category: "shake", emoji: "🥛" },

  // ארוחות מוכנות
  { id: "salad_greek", name: "סלט יווני", unit: "מנה", perUnit: { calories: 250, protein: 8, carbs: 12, fat: 18 }, category: "meal", emoji: "🥗" },
  { id: "shawarma_pita", name: "שווארמה בפיתה", unit: "פיתה", perUnit: { calories: 600, protein: 35, carbs: 50, fat: 28 }, category: "meal", emoji: "🌯" },
  { id: "tuna_sandwich", name: "כריך טונה", unit: "כריך", perUnit: { calories: 350, protein: 25, carbs: 35, fat: 12 }, category: "meal", emoji: "🥪" },

  // נשנושים
  { id: "rice_cake", name: "פריכית אורז", unit: "יחידה", perUnit: { calories: 35, protein: 1, carbs: 7, fat: 0.3 }, category: "snack", emoji: "🍘" },
  { id: "dark_choc", name: "שוקולד מריר 85%", unit: "5 משבצות", perUnit: { calories: 130, protein: 2, carbs: 7, fat: 11 }, category: "snack", emoji: "🍫" },
  { id: "protein_bar", name: "חטיף חלבון", unit: "חטיף", perUnit: { calories: 200, protein: 20, carbs: 18, fat: 6 }, category: "snack", emoji: "🍫" },
];

export const FOOD_CATEGORIES: { id: Food["category"]; label: string; emoji: string }[] = [
  { id: "protein", label: "חלבון", emoji: "🍗" },
  { id: "carb", label: "פחמימה", emoji: "🍚" },
  { id: "fat", label: "שומן", emoji: "🥑" },
  { id: "shake", label: "שייק", emoji: "💪" },
  { id: "meal", label: "ארוחה", emoji: "🍽️" },
  { id: "snack", label: "נשנוש", emoji: "🍫" },
];
