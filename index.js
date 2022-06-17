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

  fs.readdirSync('./src/objects').forEach(folder => {
    const dirHashes = {
      name: folder,
      material: {
        hash: null,
        file: null
      },
      model: {
        hash: null,
        file: null
      },
      texture: {
        hash: null,
        file: null
      }
    };
    console.log(clc.green(`Hashing folder: ${clc.blue(folder)}`));
    fs.readdirSync(`./src/objects/${folder}`).forEach(file => {
      const ext = file.split('.').pop();
      switch (ext) {
        case 'mtl':
          dirHashes.material.file = `objects/${folder}/${file}`;
          dirHashes.material.hash = hashFile(`./src/${dirHashes.material.file}`);
          console.log(clc.blue(`\t${dirHashes.material.file} ${clc.white(dirHashes.material.hash)}`), process.argv[2] || clc.magenta('Using folder hash as version'));
          break
        case 'obj':
          dirHashes.model.file = `objects/${folder}/${file}`;
          dirHashes.model.hash = hashFile(`./src/${dirHashes.model.file}`);
          console.log(clc.blue(`\t${dirHashes.model.file} ${clc.white(dirHashes.model.hash)}`), process.argv[2] || clc.magenta('Using folder hash as version'));
          break
        case 'png':
          dirHashes.texture.file = `objects/${folder}/${file}`;
          dirHashes.texture.hash = hashFile(`./src/${dirHashes.texture.file}`);
          console.log(clc.blue(`\t${dirHashes.texture.file} ${clc.white(dirHashes.texture.hash)}`), process.argv[2] || clc.magenta('Using folder hash as version'));
          break;
        default:
          break;
      }
    });

    assets.push(dirHashes);
    console.log('');
  });

  const newManifest = {
    version: process.argv[2] || computeVersionHash('./src/objects'),
    assets
  };

  fs.writeFile('./src/manifest.json', JSON.stringify(newManifest, null, 2), (err) => {
    if (err) throw err;
    fs.writeFile('./src/version', newManifest.version, (err) => {
      if (err) throw err;
      console.log(clc.green('Manifest updated! New version:'), clc.blue(newManifest.version));
    });
  });
}

main();