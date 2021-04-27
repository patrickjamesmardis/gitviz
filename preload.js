const d3 = require('d3');
const { ipcRenderer } = require('electron');
let gits;
let emojis;

ipcRenderer.invoke('get', 'gits').then(res => {
    gits = res;
});
ipcRenderer.invoke('get', 'emojis').then(res => {
    emojis = res;
});

window.addEventListener('DOMContentLoaded', () => {
    const emojiPicker = document.querySelector('emoji-picker');
    let currEmoji = null;
    function openEmojiListener(e) {
        emojiPicker.style.display = 'block';
        let xOff = 30;
        let yOff = 30;
        if (e.clientX + emojiPicker.clientWidth >= window.innerWidth) xOff = -1 * emojiPicker.clientWidth - 30;
        if (e.clientY + emojiPicker.clientHeight >= window.innerHeight) yOff = -1 * emojiPicker.clientWidth - 30;
        emojiPicker.style.transform = `translate(${e.clientX + xOff}px, ${e.clientY + yOff}px)`;
        currEmoji = e.target;
        emojiPicker.addEventListener('emoji-click', updateEmojiListener);
        document.querySelector('#main').addEventListener('click', closeEmojiListener);
    }
    function closeEmojiListener(e) {
        if (!e.target.classList.contains('emoji')) {
            emojiPicker.style.display = 'none';
            emojiPicker.removeEventListener('emoji-click', updateEmojiListener);
            document.querySelector('#main').removeEventListener('click', closeEmojiListener);
        }
    }
    function updateEmojiListener(e) {
        if (emojis.includes(e.detail.unicode)) {
            window.alert(`${e.detail.unicode} is already in use by ${gits[emojis.indexOf(e.detail.unicode)].name}`);
        } else {
            let old = currEmoji.innerHTML;
            currEmoji.innerHTML = e.detail.unicode;
            ipcRenderer.invoke('updateEmoji', [gits[emojis.indexOf(old)].path, e.detail.unicode, old]);
            emojis[emojis.indexOf(old)] = e.detail.unicode;
        }
    }
    function gitviz(e, d) {
        console.log(e);
        d3.select('section#main').style('display', 'none');
        d3.select('section#gitviz').style('display', 'flex');
        d3.select('section#terminal').select('p').text(`${d.name}`);

        ipcRenderer.invoke('gitlog', d.path).then(res => {
            d3.select('section#gitviz')
                // .append('div').classed('commits', true)
                .selectAll('div.commit').data(res).enter()
                .append('div').classed('commit', true);
            d3.selectAll('div.commit').data(res)
                .append('p').classed('timestamp', true).text(d => d.authorDate);
            d3.selectAll('div.commit').data(res)
                .append('div').classed('circle', true)
                .html(d => d.abbrevHash).transition().style('opacity', 1);

            d3.selectAll('div.commit').data(res)
                .append('p').classed('message', true).html(d => `"${d.subject}"`);

            d3.selectAll('div.commit').data(res)
                .append('p').classed('author', true).html(d => `-- ${d.authorName}`);
            d3.selectAll('div.commit').data(res)
                .append('div').classed('files', true).append('div').classed('statuses', true)
                .selectAll('p').data(d => d.status).enter()
                .append('p').html(d => d)

            d3.selectAll('div.files').data(res)
                .append('div').classed('names', true)
                .selectAll('p').data(d => d.files).enter()
                .append('p').html(d => d)


            // .data(res).enter()
            // .append('div').classed('chunk', true)
            // .style('left', (d, i) => `${i * window.innerWidth}px`)
            // .selectAll('div.circle').data((d, i) => res[i]).enter()
            // .append('div').classed('circle', true)
            // .html(d => d.abbrevHash);
            // d3.select('section#gitviz').style('width', (d, i) => `${document.querySelectorAll('div.chunk').length * window.innerWidth}px`);
            console.log(res);
        });
    }
    d3.select('#main')
        .selectAll('div.dir').data(gits).enter()
        .append('div').classed('dir', true)
        .on('click', (e, d) => gitviz(e, d))
        .text(d => d.name)
        .append('div').classed('emoji', true)
        .text((d, i) => emojis[i])
        .on('click', e => openEmojiListener(e));
});