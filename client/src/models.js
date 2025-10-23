// Available scale options for models
export const scaleOptions = {
  small: 0.25,
  medium: 0.5,
  large: 0.75
};

// Define grid dimensions for each scale (in grid cells)
export const scaleDimensions = {
  small: { width: 1, height: 1, depth: 1 },     // 0.5x0.5x0.5 world units
  medium: { width: 2, height: 2, depth: 2 },    // 1x1x1 world units
  large: { width: 3, height: 3, depth: 3 }      // 1.5x1.5x1.5 world units
};

export const modelCatalog = [
    {
        id: "bricks_A",
        name: "bricks_A",
        path: "/models/gltf/bricks_A.gltf",
        category: "building_materials",
        thumbnail: "/models/gltf/bricks_A.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells (renamed from gridSize)
        scale: scaleOptions.small, // Default scale - using predefined scale option
        rotatable: true,
    },
    {
        id: "bricks_B",
        name: "bricks_B",
        path: "/models/gltf/bricks_B.gltf",
        category: "building_materials",
        thumbnail: "/models/gltf/bricks_B.png",
        gridDimensions: { width: 1, height: 1, depth: 1 },
        scale: scaleOptions.small,
        rotatable: true,
    },
    {
        id:"colored_block_blue",
        name: "colored_block_blue",
        path: "/models/gltf/colored_block_blue.gltf",
        category: "decorative",
        thumbnail: "/models/gltf/colored_block_blue.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"colored_block_green",
        name: "colored_block_green",
        path: "/models/gltf/colored_block_green.gltf",
        category: "decorative",
        thumbnail: "/models/gltf/colored_block_green.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"colored_block_red",
        name: "colored_block_red",
        path: "/models/gltf/colored_block_red.gltf",
        category: "decorative",
        thumbnail: "/models/gltf/colored_block_red.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"colored_block_yellow",
        name: "colored_block_yellow",
        path: "/models/gltf/colored_block_yellow.gltf",
        category: "decorative",
        thumbnail: "/models/gltf/colored_block_yellow.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"decorative_block_blue",
        name: "decorative_block_blue",
        path: "/models/gltf/decorative_block_blue.gltf",
        category: "decorative",
        thumbnail: "/models/gltf/decorative_block_blue.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"decorative_block_green",
        name: "decorative_block_green",
        path: "/models/gltf/decorative_block_green.gltf",
        category: "decorative",
        thumbnail: "/models/gltf/decorative_block_green.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"decorative_block_red_B",
        name: "decorative_block_red",
        path: "/models/gltf/decorative_block_red.gltf",
        category: "decorative",
        thumbnail: "/models/gltf/decorative_block_red.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"decorative_block_yellow",
        name: "decorative_block_yellow",
        path: "/models/gltf/decorative_block_yellow.gltf",
        category: "decorative",
        thumbnail: "/models/gltf/decorative_block_yellow.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"dirt",
        name: "dirt",
        path: "/models/gltf/dirt.gltf",
        category: "ground",
        thumbnail: "/models/gltf/dirt.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"dirt_with_grass",
        name: "dirt_with_grass",
        path: "/models/gltf/dirt_with_grass.gltf",
        category: "ground",
        thumbnail: "/models/gltf/dirt_with_grass.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"dirt_with_snow",
        name: "dirt_with_snow",
        path: "/models/gltf/dirt_with_snow.gltf",
        category: "ground",
        thumbnail: "/models/gltf/dirt_with_snow.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"glass",
        name: "glass",
        path: "/models/gltf/glass.gltf",
        category: "building_materials",
        thumbnail: "/models/gltf/glass.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"grass",
        name: "grass",
        path: "/models/gltf/grass.gltf",
        category: "ground",
        thumbnail: "/models/gltf/grass.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"grass_with_snow",
        name: "grass_with_snow",
        path: "/models/gltf/grass_with_snow.gltf",
        category: "ground",
        thumbnail: "/models/gltf/grass_with_snow.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"gravel",
        name: "gravel",
        path: "/models/gltf/gravel.gltf",
        category: "ground",
        thumbnail: "/models/gltf/gravel.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"gravel_with_grass",
        name: "gravel_with_grass",
        path: "/models/gltf/gravel_with_grass.gltf",
        category: "ground",
        thumbnail: "/models/gltf/gravel_with_grass.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"gravel_with_snow",
        name: "gravel_with_snow",
        path: "/models/gltf/gravel_with_snow.gltf",
        category: "ground",
        thumbnail: "/models/gltf/gravel_with_snow.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"lava",
        name: "lava",
        path: "/models/gltf/lava.gltf",
        category: "ground",
        thumbnail: "/models/gltf/lava.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"metal",
        name: "metal",
        path: "/models/gltf/metal.gltf",
        category: "building_materials",
        thumbnail: "/models/gltf/metal.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"prototype",
        name: "prototype",
        path: "/models/gltf/prototype.gltf",
        category: "building_materials",
        thumbnail: "/models/gltf/prototype.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"sand_A",
        name: "sand_A",
        path: "/models/gltf/sand_A.gltf",
        category: "ground",
        thumbnail: "/models/gltf/sand_A.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"sand_B",
        name: "sand_B",
        path: "/models/gltf/sand_B.gltf",
        category: "ground",
        thumbnail: "/models/gltf/sand_B.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"sand_with_grass",
        name: "sand_with_grass",
        path: "/models/gltf/sand_with_grass.gltf",
        category: "ground",
        thumbnail: "/models/gltf/sand_with_grass.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"sand_with_snow",
        name: "sand_with_snow",
        path: "/models/gltf/sand_with_snow.gltf",
        category: "ground",
        thumbnail: "/models/gltf/sand_with_snow.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"snow",
        name: "snow",
        path: "/models/gltf/snow.gltf",
        category: "ground",
        thumbnail: "/models/gltf/snow.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"stone",
        name: "stone",
        path: "/models/gltf/stone.gltf",
        category: "building_materials",
        thumbnail: "/models/gltf/stone.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"stone_dark",
        name: "stone_dark",
        path: "/models/gltf/stone_dark.gltf",
        category: "building_materials",
        thumbnail: "/models/gltf/stone_dark.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"stone_with_copper",
        name: "stone_with_copper",
        path: "/models/gltf/stone_with_copper.gltf",
        category: "ground",
        thumbnail: "/models/gltf/stone_with_copper.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"stone_with_gold",
        name: "stone_with_gold",
        path: "/models/gltf/stone_with_gold.gltf",
        category: "ground",
        thumbnail: "/models/gltf/stone_with_gold.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"stone_with_silver",
        name: "stone_with_silver",
        path: "/models/gltf/stone_with_silver.gltf",
        category: "ground",
        thumbnail: "/models/gltf/stone_with_silver.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"striped_block_blue",
        name: "striped_block_blue",
        path: "/models/gltf/striped_block_blue.gltf",
        category: "decorative",
        thumbnail: "/models/gltf/striped_block_blue.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"striped_block_green",
        name: "striped_block_green",
        path: "/models/gltf/striped_block_green.gltf",
        category: "decorative",
        thumbnail: "/models/gltf/striped_block_green.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"striped_block_red",
        name: "striped_block_red",
        path: "/models/gltf/striped_block_red.gltf",
        category: "decorative",
        thumbnail: "/models/gltf/striped_block_red.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"striped_block_yellow",
        name: "striped_block_yellow",
        path: "/models/gltf/striped_block_yellow.gltf",
        category: "decorative",
        thumbnail: "/models/gltf/striped_block_yellow.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"tree",
        name: "tree",
        path: "/models/gltf/tree.gltf",
        category: "ground",
        thumbnail: "/models/gltf/tree.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"tree_with_snow",
        name: "tree_with_snow",
        path: "/models/gltf/tree_with_snow.gltf",
        category: "ground",
        thumbnail: "/models/gltf/tree_with_snow.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"water",
        name: "water",
        path: "/models/gltf/water.gltf",
        category: "ground",
        thumbnail: "/models/gltf/water.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    },
    {
        id:"wood",
        name: "wood",
        path: "/models/gltf/wood.gltf",
        category: "building_materials",
        thumbnail: "/models/gltf/wood.png",
        gridDimensions: { width: 1, height: 1, depth: 1 }, // Size in grid cells
        scale: scaleOptions.small, // Scale factor for the model
        rotatable: true
    }
]

export const modelCategories = [
    { id: "building_materials", name: "Building Materials" },
    { id: "ground", name: "Ground" },
    { id: "decorative", name: "Decorative" },
]