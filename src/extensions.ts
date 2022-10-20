// Apparently we cannot extend the array prototype with new functions so utils is all we have.

export const groupBy = (arr: any[], key: string): any[] =>
{
    return arr.reduce((reducer, x) =>
    {
        (reducer[x[key]] = reducer[x[key]] ?? []).push(x);
        return reducer;
    }, {});
};

export const isNumeric = (value: any): boolean =>
{
    return !isNaN(value - parseFloat(value));
};

/**
 * Splits string into an array at each occasion of searchString up to given count.
 * @param {string} searchString - String to search and split by.
 * @param {number} count - Number of splits by search-string to do from start. The rest of the string is contained in a single substring;
 * @returns An array of substrings.
 */
export const substringSplit = function (
    text: string,
    searchString: string,
    count?: number
)
{
    if (typeof count === "undefined") return text.split(searchString);

    if (!searchString || searchString.length === 0)
        throw new Error(
            "substringSplit only supports splitting with non empty strings"
        );

    const subStrings = [];
    let prevIndexOf = 0;
    let indexOf = 0;

    for (let i = 0; i < count && prevIndexOf < text.length; i++)
    {
        indexOf = text.indexOf(searchString, prevIndexOf);
        if (indexOf === -1) break;

        subStrings.push(text.substring(prevIndexOf, indexOf));
        prevIndexOf = indexOf + searchString.length;
    }

    if (prevIndexOf < text.length) subStrings.push(text.substring(prevIndexOf));

    return subStrings;
};

export const stringIsEmpty = (value: unknown) =>
{
    if (typeof value !== "string") return value === undefined || value === null;
    return !(value ?? value === "");
};
