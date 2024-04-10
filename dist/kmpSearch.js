var buildKmpTable = function (pattern) {
    var table = new Array(pattern.length).fill(0);
    var j = 0;
    for (var i = 1; i < pattern.length; i++) {
        if (pattern[i] === pattern[j]) {
            j++;
            table[i] = j;
        }
        else if (j > 0) {
            j = table[j - 1];
            i--;
        }
    }
    return table;
};
var kmpSearch = function (text, pattern, skipFirst) {
    var table = buildKmpTable(pattern);
    var j = 0;
    var firstMatchSkipped = false;
    for (var i = 0; i < text.length; i++) {
        if (text[i] === pattern[j]) {
            j++;
            if (j === pattern.length) {
                // A match is found
                if (skipFirst && !firstMatchSkipped) {
                    firstMatchSkipped = true;
                    // Reset j to continue search
                    j = 0;
                }
                else {
                    return i - j + 1;
                }
            }
        }
        else if (j > 0) {
            j = table[j - 1];
            i--; // Rewind to re-check the current character in the next iteration
        }
    }
    return -1;
};
export default kmpSearch;
