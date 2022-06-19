const {createHash} = require('crypto');
const clc = require('cli-color');
const fs = require('fs');
const path = require('path');

const hashFile = (file) => {
  const hash = createHash('md5');
  const data = fs.readFileSync(file);
  hash.update(data);
  return hash.digest('hex');
}

function computeVersionHash(folder, inputHash = null) {
  const hash = inputHash ? inputHash : createHash('sha256');
  const info = fs.readdirSync(folder, { withFileTypes: true });

  for (let item of info) {
      const fullPath = path.join(folder, item.name);
      if (item.isFile()) {
          const contents = fs.readFileSync(fullPath);
          // compute hash string name:size:mtime
          const fileInfo = `${fullPath}:${contents}`;
          hash.update(fileInfo);
      } else if (item.isDirectory()) {
          // recursively walk sub-folders
          computeVersionHash(fullPath, hash);
      }
  }

  if (!inputHash) {
      return hash.digest('hex');
  }
}

const main = () => {
  const assets = [];

  fs.readdirSync('./src/objects').forEach(file => {
    const dirHashes = {
      name: file.split('.')[0],
      hash: hashFile(`./src/objects/${file}`),
      file: `objects/${file}`,
    };
    console.log(clc.blue(`${dirHashes.file} ${clc.white(dirHashes.hash)}`), process.argv[2] || clc.magenta('Using folder hash as version'));
    assets.push(dirHashes);
  });

  const newManifest = {
    version: process.argv[2] || computeVersionHash('./src/objects'),
    assets
  };

  fs.writeFile('./src/manifest.json', JSON.stringify(newManifest, null, 2), (err) => {
    if (err) throw err;
    fs.writeFile('./src/version', newManifest.version, (err) => {
      if (err) throw err;
      console.log('');
      console.log(clc.green('Manifest updated! New version:'), clc.blue(newManifest.version));
    });
  });
}

main();