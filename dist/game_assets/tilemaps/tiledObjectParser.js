const fs = require("fs");
const path = require("path");

const fileName = process.argv[2] || "SMTilemap.json";
const fileBaseName = path.basename(fileName, ".json");
const inputFile = `./${fileName}`;
const outputDir = `./parsedObjects/${fileBaseName}/`;

// Ensure output folder exists
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const mapData = JSON.parse(fs.readFileSync(inputFile, "utf-8"));

// Helper to write JSON with [x, y] on same line
function writeJSONFile(filePath, obj, wrapItems = false) {
    let output;
    if (wrapItems) output = { items: obj };
    else output = obj;

    // Custom replacer to print [x,y] arrays on same line
    function replacer(key, value) {
        if (Array.isArray(value) && value.length === 2 && typeof value[0] === "number") {
            return value; // keep [x,y] as array
        }
        return value;
    }

    // Pretty-print with 4-space indentation
    let jsonStr = JSON.stringify(output, replacer, 4);

    // Remove newlines inside [x, y] arrays
    jsonStr = jsonStr.replace(/\[\s*([0-9\.\-]+),\s*([0-9\.\-]+)\s*\]/g, '[$1, $2]');

    fs.writeFileSync(filePath, jsonStr);
    console.log(`Exported ${filePath}`);
}

// Define which layers are teams and which are items
const teamLayers = ["SPY_red", "SPY_blue"];
const itemLayers = ["SPY_healthpacks", "SPY_laserguns"];

for (const layer of mapData.layers) {
    if (layer.type !== "objectgroup") continue;

    const layerName = layer.name.trim();

    if (teamLayers.includes(layerName)) {
        const teamObj = { enemies: [], healers: [] };

        for (const obj of layer.objects) {
            const x = obj.x + (obj.width || 0) / 2;
            const y = obj.y + (obj.height || 0) / 2;

            const isHealer = obj.properties?.some(p => p.name === "isHealer" && p.value === true);
            if (isHealer) teamObj.healers.push([x, y]);
            else teamObj.enemies.push([x, y]);
        }

        writeJSONFile(path.join(outputDir, `${fileBaseName}_${layerName}.json`), teamObj);
    } else if (itemLayers.includes(layerName)) {
        const positions = layer.objects.map(obj => {
            const x = obj.x + (obj.width || 0) / 2;
            const y = obj.y + (obj.height || 0) / 2;
            return [x, y];
        });

        writeJSONFile(path.join(outputDir, `${fileBaseName}_${layerName}.json`), positions, true);
    }
}