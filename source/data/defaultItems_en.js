/*
================================================================================
File: source/data/defaultItems_en.js
Description: English version of default packing items for new checklists
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-10-18
================================================================================
*/

export const defaultItemsEN = [
  // Note: `id` and `isPacked` are intentionally ignored here. The runtime
  // `Item` instances are created with generated IDs (`generateSecureId`) and
  // `isPacked` defaults to false. Keeping IDs out of this static file avoids
  // confusion and ensures the application uses secure/deterministic ID
  // generation at runtime.

  // Summer Wear
  { name: "T-shirt",                          category: "Summer Wear",      quantity: 1 },
  { name: "Shirt",                            category: "Summer Wear",      quantity: 1 },
  { name: "Light Jacket",                     category: "Summer Wear",      quantity: 1 },
  { name: "Shorts",                           category: "Summer Wear",      quantity: 1 },

  // Winter Wear
  { name: "Base Layer",                       category: "Winter Wear",      quantity: 1 },
  { name: "Long Sleeve Shirt",                category: "Winter Wear",      quantity: 1 },
  { name: "Hoodie",                           category: "Winter Wear",      quantity: 1 },
  { name: "Jacket",                           category: "Winter Wear",      quantity: 1 },
  { name: "Down Jacket",                      category: "Winter Wear",      quantity: 1 },
  { name: "Windbreaker",                      category: "Winter Wear",      quantity: 1 },
  { name: "Pants",                            category: "Winter Wear",      quantity: 1 },

  // Underwear
  { name: "Underwear",                        category: "Underwear",        quantity: 1 },
  { name: "Socks",                            category: "Underwear",        quantity: 1 },
  { name: "Pajamas",                          category: "Underwear",        quantity: 1 },

  // Accessories
  { name: "Cap / Hat",                        category: "Accessories",      quantity: 1 },
  { name: "Beanie",                           category: "Accessories",      quantity: 1 },
  { name: "Sunglasses",                       category: "Accessories",      quantity: 1 },
  { name: "Scarf",                            category: "Accessories",      quantity: 1 },
  { name: "Gloves",                           category: "Accessories",      quantity: 1 },
  { name: "Belt",                             category: "Accessories",      quantity: 1 },
  { name: "Shoes",                            category: "Accessories",      quantity: 1 },
  { name: "Sandals / Flip Flops",             category: "Accessories",      quantity: 1 },
  { name: "Backpack",                         category: "Accessories",      quantity: 1 },
  { name: "Sling Bag",                        category: "Accessories",      quantity: 1 },
  { name: "Packing Cubes",                    category: "Accessories",      quantity: 1 },
  { name: "Laundry Bag",                      category: "Accessories",      quantity: 1 },
  { name: "Swimsuit",                         category: "Accessories",      quantity: 1 },

  // Toiletries
  { name: "Towel",                            category: "Toiletries",       quantity: 1 },
  { name: "Toothbrush",                       category: "Toiletries",       quantity: 1 },
  { name: "Toothpaste",                       category: "Toiletries",       quantity: 1 },
  { name: "Dental Floss",                     category: "Toiletries",       quantity: 1 },
  { name: "Facial Cleanser",                  category: "Toiletries",       quantity: 1 },
  { name: "Cotton Swabs",                     category: "Toiletries",       quantity: 1 },
  { name: "Comb",                             category: "Toiletries",       quantity: 1 },
  { name: "Tissues / Wet Wipes",              category: "Toiletries",       quantity: 1 },
  { name: "Razor / Shaver",                   category: "Toiletries",       quantity: 1 },
  { name: "Shampoo / Conditioner",            category: "Toiletries",       quantity: 1 },
  { name: "Soap / Body Wash",                 category: "Toiletries",       quantity: 1 },
  { name: "Menstrual Products",               category: "Toiletries",       quantity: 1 },
  
  // Skincare
  { name: "Sunscreen",                        category: "Skincare",         quantity: 1 },
  { name: "Skincare Products",                category: "Skincare",         quantity: 1 },
  { name: "Lip Balm",                         category: "Skincare",         quantity: 1 },
  { name: "Body Lotion",                      category: "Skincare",         quantity: 1 },
  { name: "Hand Cream",                       category: "Skincare",         quantity: 1 },

  // Smart Devices
  { name: "Phone / Charger",                  category: "Smart Devices",    quantity: 1 },
  { name: "Tablet / Charger",                 category: "Smart Devices",    quantity: 1 },
  { name: "Laptop / Charger",                 category: "Smart Devices",    quantity: 1 },
  { name: "Headphones / Charger",             category: "Smart Devices",    quantity: 1 },

  // Photography
  { name: "Camera",                           category: "Photography",      quantity: 1 },
  { name: "Lens",                             category: "Photography",      quantity: 1 },
  { name: "Camera Battery / Charger",         category: "Photography",      quantity: 1 },
  { name: "Memory Card",                      category: "Photography",      quantity: 1 },
  { name: "Tripod",                           category: "Photography",      quantity: 1 },

  // Documents
  { name: "Passport",                         category: "Documents",        quantity: 1 },
  { name: "Visa",                             category: "Documents",        quantity: 1 },
  { name: "(International) Driver's License", category: "Documents",        quantity: 1 },
  { name: "ID Photo / Passport Copy",         category: "Documents",        quantity: 1 },
  { name: "Accommodation Confirmation",       category: "Documents",        quantity: 1 },
  { name: "Travel Insurance Info",            category: "Documents",        quantity: 1 },
  { name: "Boarding Pass / Itinerary",        category: "Documents",        quantity: 1 },
  { name: "Emergency Contacts",               category: "Documents",        quantity: 1 },

  // Finance
  { name: "Cash / Foreign Currency",          category: "Finance",          quantity: 1 },
  { name: "Credit Card",                      category: "Finance",          quantity: 1 },
  { name: "Wallet",                           category: "Finance",          quantity: 1 },
  { name: "Keys",                             category: "Finance",          quantity: 1 },

  // Medicine
  { name: "First Aid Kit",                    category: "Medicine",         quantity: 1 },
  { name: "Hand Sanitizer",                   category: "Medicine",         quantity: 1 },
  { name: "Cold Medicine",                    category: "Medicine",         quantity: 1 },
  { name: "Pain Relief Medicine",             category: "Medicine",         quantity: 1 },
  { name: "Stomach Medicine",                 category: "Medicine",         quantity: 1 },
  { name: "Allergy Medicine",                 category: "Medicine",         quantity: 1 },
  { name: "Insect Repellent",                 category: "Medicine",         quantity: 1 },
  { name: "Face Masks",                       category: "Medicine",         quantity: 1 },
  { name: "Prescription Medication",          category: "Medicine",         quantity: 1 },
  { name: "Motion Sickness Pills",            category: "Medicine",         quantity: 1 },

  // Food & Drink
  { name: "Water Bottle",                     category: "Food & Drink",     quantity: 1 },
  { name: "Tableware",                        category: "Food & Drink",     quantity: 1 },
  { name: "Lunch Box",                        category: "Food & Drink",     quantity: 1 },
  { name: "Cup",                              category: "Food & Drink",     quantity: 1 },
  { name: "Snacks",                           category: "Food & Drink",     quantity: 1 },

  // Travel Items
  { name: "Phone Lanyard",                    category: "Travel Items",     quantity: 1 },
  { name: "Neck Pillow",                      category: "Travel Items",     quantity: 1 },
  { name: "Eye Mask",                         category: "Travel Items",     quantity: 1 },
  { name: "Pen",                              category: "Travel Items",     quantity: 1 },
  { name: "Internet (eSIM / WiFi)",           category: "Travel Items",     quantity: 1 },
  { name: "Power Bank",                       category: "Travel Items",     quantity: 1 },
  { name: "Travel Plug Adapter",              category: "Travel Items",     quantity: 1 },
  { name: "Luggage Strap",                    category: "Travel Items",     quantity: 1 },
  { name: "Luggage Tags",                     category: "Travel Items",     quantity: 1 },

  // Outdoor Items
  { name: "Swiss Knife",                      category: "Outdoor Items",    quantity: 1 },
  { name: "Headlamp / Flashlight",            category: "Outdoor Items",    quantity: 1 },
  { name: "Batteries",                        category: "Outdoor Items",    quantity: 1 },
  { name: "Binoculars",                       category: "Outdoor Items",    quantity: 1 },
  { name: "Umbrella",                         category: "Outdoor Items",    quantity: 1 },
  { name: "Raincoat",                         category: "Outdoor Items",    quantity: 1 }
];
