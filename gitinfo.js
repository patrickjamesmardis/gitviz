const path = require('path');
const fs = require('fs');
class dir {
    constructor(dirpath, depth = 0) {
        this.path = dirpath;
        this.dirs = [];
        this.files = [];
        this.isGit = false;
        this.depth = depth;
        fs.readdirSync(dirpath, { withFileTypes: true }).forEach(item => {
            if (item.name === '.git') this.isGit = true;
            else if (item.isDirectory() && item.name[0] !== '.' && item.name !== 'Library' && item.name !== 'node_modules' && item.name !== 'node_modules.nosync' && item.name !== 'Applications' && item.name !== 'Pictures' && item.name !== 'Music' && item.name !== 'Movies' && item.name !== 'sound' && item.name !== 'premiere' && item.name !== 'out') {
                this.dirs.push(new dir(path.resolve(dirpath, item.name), depth + 1));
            } else {
                this.files.push(path.resolve(dirpath), item.name);
            }
        });
    }
}
module.exports = dir;