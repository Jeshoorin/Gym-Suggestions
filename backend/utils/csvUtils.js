const fs = require("fs");

// Flexible header check/creation
exports.ensureCSV = (filePath, expectedHeaders) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, expectedHeaders.join(",") + "\n");
    console.log(`Created CSV at ${filePath} with headers.`);
  } else {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.trim().split("\n");
    const existingHeaders = lines[0].split(",");
    const missingHeaders = expectedHeaders.filter(h => !existingHeaders.includes(h));

    if (missingHeaders.length > 0) {
      console.warn(`CSV at ${filePath} missing headers: ${missingHeaders.join(", ")}`);
      // Rewrite CSV with correct headers and preserve existing data (best effort)
      const restLines = lines.slice(1);
      // Overwrite file with correct headers + existing data (no header fix inside data lines)
      fs.writeFileSync(filePath, expectedHeaders.join(",") + "\n" + restLines.join("\n"));
      console.log(`CSV headers fixed at ${filePath}`);
    }
  }
};


exports.readCSV = (path) => {
  const data = fs.readFileSync(path, "utf8").trim().split("\n");
  const headers = data[0].split(",");
  return data.slice(1).map(line => {
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    while (values.length < headers.length) values.push("");
    return headers.reduce((acc, header, i) => {
      let val = values[i]?.trim() || "";
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1); // Remove surrounding quotes
      }
      acc[header.trim()] = val;
      return acc;
    }, {});
  });
};

exports.appendCSV = (path, obj) => {
  const headers = fs.readFileSync(path, "utf8").trim().split("\n")[0].split(",");
  const values = headers.map(header => {
    const val = obj[header] || "";
    return `"${val.toString().replace(/"/g, '""')}"`; // Escape quotes
  });
  const line = "\n" + values.join(",");
  fs.appendFileSync(path, line);
};

exports.writeCSV = (path, data) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const lines = data.map(row =>
    headers.map(h => `"${(row[h] || "").toString().replace(/"/g, '""')}"`).join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  fs.writeFileSync(path, csv);
};
