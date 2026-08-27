const fs = require("node:fs");
const path = require("node:path");

const inputFile = path.resolve(__dirname, "../temp/PEPXiaoXue6_1.json");
const outputFile = path.resolve(__dirname, "../temp/PEPXiaoXue6_1.csv");

/**
 * 将字符串安全地转为 CSV 单元格值。
 * 如果值包含逗号、双引号或换行符，则用双引号包裹，内部的引号转义为两个引号。
 */
function csvEscape(value) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 读取全部行，过滤空行
const lines = fs
  .readFileSync(inputFile, "utf-8")
  .split(/\r?\n/)
  .filter((line) => line.trim());

const header = "wordRank,headWord,content,bookId";
const rows = [header];

for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    const wordRank = obj.wordRank ?? "";
    const headWord = obj.headWord ?? "";
    // content 原样序列化为 JSON 字符串（保留缩进会太大，用无空格版本）
    const content = JSON.stringify(obj.content ?? "");
    const bookId = obj.bookId ?? "";

    rows.push([wordRank, headWord, csvEscape(content), csvEscape(bookId)].join(","));
  } catch (err) {
    console.error("跳过无法解析的行:", err.message);
  }
}

fs.writeFileSync(outputFile, rows.join("\n"), "utf-8");
console.log(`已生成: ${outputFile}`);
console.log(`共处理 ${rows.length - 1} 条记录`);