console.time('keys+map');
[...Array(1_000_001).keys()].map(i => i);
console.timeEnd('keys+map');

console.time('Array.from');
Array.from({ length: 1_000_001 }, (_, i) => i);
console.timeEnd('Array.from');

console.time('for-loop');
{
    const len = 1_000_001;
    const arr = new Array(len);
    for (let i = 0; i < len; i++) arr[i] = i;
}
console.timeEnd('for-loop');


//result
// keys+map: 57.461ms
//Array.from: 33.756ms
//for-loop: 3.037ms