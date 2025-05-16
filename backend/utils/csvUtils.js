const fs = require("fs");

// Flexible header check/creation
exports.ensureCSV = (path, expectedHeaders) => {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, expectedHeaders.join(",") + "\n");
  } else {
    const existingHeaders = fs.readFileSync(path, "utf8").trim().split("\n")[0].split(",");
    const missingHeaders = expectedHeaders.filter(h => !existingHeaders.includes(h));
    if (missingHeaders.length > 0) {
      console.warn(`CSV at ${path} missing headers: ${missingHeaders.join(", ")}`);
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
