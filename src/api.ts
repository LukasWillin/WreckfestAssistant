// import { parse } from ""; //"../node_modules/csv/dist/esm/index";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import csv from "csvtojson";
import { groupBy, isNumeric, stringIsEmpty, substringSplit } from "./extensions";

const isFreeStandingEventSpot = (
    trackPool: any[],
    eventList: any[],
    trackConfigurationIndex: number,
    duplicateMemoryLength: number,
    eventIndexToTest: number,
    eventCount: number,
    baseMap: string
) =>
{
    const firstIndex = eventIndexToTest - duplicateMemoryLength;
    const circularSubEventList = [];

    // Create a structure which takes start & end of the event list into account
    for (let i = 0; i < duplicateMemoryLength * 2; i++)
    {
        let currentEventIndex = i + firstIndex;
        currentEventIndex =
            currentEventIndex < 0
                ? currentEventIndex + eventCount
                : currentEventIndex;
        currentEventIndex =
            currentEventIndex >= eventCount
                ? currentEventIndex % eventCount
                : currentEventIndex;
        circularSubEventList.push(eventList[currentEventIndex]);
    }

    if (circularSubEventList.includes(trackConfigurationIndex)) return false;

    if (baseMap)
        return (
            circularSubEventList.findIndex(
                (cseli) => cseli !== undefined && trackPool[cseli].baseMap === baseMap
            ) !== -1
        );

    return true;
};

const swapIndices = (list: any[], i1: number, i2: number) =>
{
    const tempEli = list[i1];
    list[i1] = list[i2];
    list[i2] = tempEli;
};

export interface IReadCsvResult
{ 
    records: any[],
    defaultSettings: any
}

export interface IRawEvent
{
    debugOutput: any,
    trackPool: any[],
    eventList: any[]
}

/**
 * Command: 'event generate-config'.
 *
 * @param {Message} message - Message object.
 */
export const readCsv = async (csvInput: string): Promise<IReadCsvResult> =>
{
    let defaultSettings: any = null;
    let records: any[] = [];

    records = 
        (await new Promise((resolve, reject) =>
        {
            csv({ delimiter: ";" }).fromString(csvInput)
                .then((value: any[]) => resolve(value), (reason: any) => reject(reason));
        })) ?? [];

    records.forEach((record: any) =>
    {
        record.count = isNumeric(record.count)
            ? Math.floor(Number.parseFloat(record.count) + 0.5)
            : 0;
        record.trackLength = isNumeric(record.trackLength)
            ? Number.parseFloat(record.trackLength)
            : -1;
        if (record.trackLength > 0)
        {
            // These arbitrarily set numbers account to roughly the same number of tracks in each group as of 2022.10.12
            if (record.trackLength < 1.05) record.trackLengthGroup = "short"; // 32
            else if (record.trackLength < 1.8)
                record.trackLengthGroup = "medium"; // 34
            else record.trackLengthGroup = "long"; // 32
        }
        else
        {
            record.trackLengthGroup = "arena";
        }
        record.commentTitle = `${record.mapTitle ?? ""} ${!stringIsEmpty(record.banger)
            ? record.banger
            : !stringIsEmpty(record.arena)
                ? record.arena
                : ""
        } - ${isNumeric(record.trackLength)
            ? record.trackLength + " km"
            : record.trackLength
        }`;
        // record.laps = isNumeric(record.laps) ? Math.floor(Number.parseFloat(record.laps) + 0.5) : 0;
        // record.botCount = isNumeric(record.botCount) ? Math.floor(Number.parseFloat(record.botCount) + 0.5) : 0;
        // record.teamCount = isNumeric(record.teamCount) ? Math.floor(Number.parseFloat(record.teamCount) + 0.5) : 0;
        // record.eliminationInterval = isNumeric(record.eliminationInterval) ? Math.floor(Number.parseFloat(record.eliminationInterval) + 0.5) : 0;
        // record.timeLimit = isNumeric(record.timeLimit) ? Math.floor(Number.parseFloat(record.timeLimit) + 0.5) : 0;
        // record.car_reset_delay = isNumeric(record.car_reset_delay) ? Math.floor(Number.parseFloat(record.car_reset_delay) + 0.5) : 0;
    });

    const defaultTrackIndex = records.findIndex((r) => r.trackId === "default");

    defaultSettings = defaultTrackIndex >= 0 ? records.splice(defaultTrackIndex, 1)[0] : null;

    return { defaultSettings, records };
}

/**
 *
 * @param {object[]} trackPool
 * @param {boolean} defaultSettings
 * @returns
 */
export async function generateConfigFileByTrackPool(
    trackPool: any[],
    defaultSettings: any
): Promise<IRawEvent>
{
    // Filter all tracks rated 0 or lower
    trackPool = trackPool.filter((trackConfig) => trackConfig.count > 0);
    if (trackPool.length < 1) throw new Error("trackPool is empty");

    // Get base maps for each track configuration
    trackPool.forEach(
        (trackConfig) =>
            (trackConfig.baseMap = substringSplit(trackConfig.trackId, "_", 1)[0])
    );
    // Sort by descending count
    trackPool.sort((t1, t2) => t2.count - t1.count);

    // Group maps by base map
    const baseMapGroups = groupBy(trackPool, "baseMap");
    const baseMapCount = Object.keys(baseMapGroups).length;

    // No base map should follow up twice
    const duplicateMemoryLength = Math.ceil(baseMapCount * 0.5);

    // From the count generate a count at which a track appears in the rotation
    // From that count accumulate the total event length
    let eventCount = 0;
    trackPool.forEach((trackConfig) =>
    {
        eventCount += trackConfig.count;
    });

    // Store an event list which only contains the indexes of the trackPool
    const eventList = new Array(eventCount);

    // Fill at random free standing spots
    for (
        let trackConfigurationIndex = 0;
        trackConfigurationIndex < trackPool.length;
        trackConfigurationIndex++
    )
    {
        const trackConfiguration = trackPool[trackConfigurationIndex];
        for (let r = 0; r < trackConfiguration.count; r++)
        {
            let randomIndex = Math.round(Math.random() * (eventCount - 1));

            // Make sure to search list only once
            let searchGuard = 0;

            while (
                searchGuard <= eventCount &&
                eventList[randomIndex] !== undefined
            )
            {
                // !isFreeStandingEventSpot(trackConfigurationIndex, randomIndex, trackConfiguration.baseMap))
                randomIndex = ++randomIndex % eventCount;
                searchGuard++;
            }

            eventList[randomIndex] = trackConfigurationIndex;
        }
    }

    // Space out duplicates
    let dupesFound = true;
    let passes = 0;

    const maxPasses = Math.ceil(1000);
    for (; passes < maxPasses && dupesFound; passes++)
    {
        const dupeMemory = new Array(duplicateMemoryLength);

        let prevTrackLengthGroup = "none";

        dupesFound = false;

        for (let c = 0; c < eventCount; c++) 
        {
            const i = (c + passes) % eventCount;
            const trackConfiguration = trackPool[eventList[i]];

            if (prevTrackLengthGroup === trackConfiguration.trackLengthGroup)
            {
                prevTrackLengthGroup = trackConfiguration.trackLengthGroup;
                swapIndices(eventList, i, i + (((i % 2) + 1) % eventCount));
                continue;
            }

            // TODO: This needs to be adapted to the new shifting pass-index
            // If map is not in dupe add then go to next event in list
            if (!dupeMemory.includes(trackConfiguration.baseMap))
            {
                dupeMemory[i % duplicateMemoryLength] = trackConfiguration.baseMap;
                continue;
            }
            // If map is in dupe memory then move it and restart the dupe test.

            dupesFound = true;

            // Get positions to move
            const positionsToMove = Math.ceil(
                Math.random() * (duplicateMemoryLength * 1.1) +
                duplicateMemoryLength * 0.05
            );

            // Move back by naive swapping
            for (let j = 0; j < positionsToMove; j++)
            {
                swapIndices(eventList, (i + j) % eventCount, (i + j + 1) % eventCount);
            }

            break;
        }
    }

    // Output debug information as json into a different file
    let debugOutput = null;

    const debugDate = new Date();
    const debugDupeMemory = new Array(duplicateMemoryLength);
    let debugAnyNaN = false;
    let debugAnyEmpty = false;
    const debugDupeIndizes = [];
    const debugLengthExceeded = eventList[eventCount] >= 0;
    let debugMaxTrackOccurence = 0;

    for (let i = 0; i < eventCount; i++)
    {
        // Test if empty
        if (eventList[i] === undefined) debugAnyEmpty = true;
        // Test if Not a Number
        else if (!debugAnyNaN && Number.isNaN(eventList[i])) debugAnyNaN = true;

        const trackConfiguration = trackPool[eventList[i]];

        if (debugDupeMemory.includes(trackConfiguration.baseMap))
            debugDupeIndizes.push(i);

        let count = trackConfiguration.count;

        trackConfiguration.count = Number.isFinite(count) ? ++count : 1;

        if (debugMaxTrackOccurence < count) debugMaxTrackOccurence = count;

        debugDupeMemory[i % debugDupeMemory.length] = trackConfiguration.baseMap;
    }

    debugOutput = {
        debugDate,
        debugLengthExceeded,
        debugAnyNaN,
        debugAnyEmpty,
        minSpaceBetween: debugDupeMemory.length,
        trackPoolCount: trackPool.length,
        eventCount,
        debugMaxTrackOccurence,
        /*debugDupeMemory,*/ spacingPasses: passes,
        debugDupeIndizes,
        eventList: eventList.map((trackPoolIndex) => trackPool[trackPoolIndex]),
    };

    return { debugOutput, trackPool, eventList };
}

export async function writeCfg(
    defaultSettings: any,
    trackPool: any[],
    eventList: any[]
): Promise<string>
{
    const outCfgLines = [];

    try
    {
        if (defaultSettings)
        {
            outCfgLines.push(`

# Set game mode, list available game modes with command: gamemodes`);
            if (stringIsEmpty(defaultSettings.gameMode)) outCfgLines.push("#");

            outCfgLines.push(`gamemode=${defaultSettings.gameMode}\n`);

            outCfgLines.push(`# Prepopulate server with AI bots, 0-24`);
            if (stringIsEmpty(defaultSettings.botCount)) outCfgLines.push("#");
            outCfgLines.push(`bots=${defaultSettings.botCount}\n`);

            outCfgLines.push(`# Number of teams in team game modes, 2-4`);
            if (stringIsEmpty(defaultSettings.teamCount)) outCfgLines.push("#");
            outCfgLines.push(`num_teams=${defaultSettings.teamCount}\n`);

            outCfgLines.push(`# Amount of laps in race game modes, 1-60`);
            if (stringIsEmpty(defaultSettings.laps)) outCfgLines.push("#");
            outCfgLines.push(`laps=${defaultSettings.laps}\n`);

            outCfgLines.push(`# Deathmatch time limit in minutes`);
            if (stringIsEmpty(defaultSettings.timeLimit)) outCfgLines.push("#");
            outCfgLines.push(`time_limit=${defaultSettings.timeLimit}\n`);

            outCfgLines.push(
                `# Elimination interval time for elimination race: 0, 20, 30, 45, 60, 90, 120`
            );
            outCfgLines.push(`# (0 means elimination each lap, others are seconds)`);
            if (stringIsEmpty(defaultSettings.eliminationInterval))
                outCfgLines.push("#");
            outCfgLines.push(
                `elimination_interval=${defaultSettings.eliminationInterval}\n`
            );

            outCfgLines.push(
                `# Allow only vehicles with a maximum class of a, b, c or d`
            );
            if (stringIsEmpty(defaultSettings.classRestriction))
                outCfgLines.push("#");
            outCfgLines.push(
                `car_class_restriction=${defaultSettings.classRestriction}\n`
            );

            outCfgLines.push(
                `# Allow only one specific car, list available cars with command: cars`
            );
            if (stringIsEmpty(defaultSettings.carRestriction)) outCfgLines.push("#");
            outCfgLines.push(`car_restriction=${defaultSettings.carRestriction}\n`);

            outCfgLines.push(`# Disallow use of special vehicles`);
            if (stringIsEmpty(defaultSettings.disableSpecialVehicles))
                outCfgLines.push("#");
            outCfgLines.push(
                `special_vehicles_disabled=${defaultSettings.disableSpecialVehicles}\n`
            );

            outCfgLines.push(`# Disable car resets`);
            if (stringIsEmpty(defaultSettings.disableCarReset)) outCfgLines.push("#");
            outCfgLines.push(
                `car_reset_disabled=${defaultSettings.disableCarReset}\n`
            );

            outCfgLines.push(`# Set car reset delay to 0 (no delay) or 1-20 seconds`);
            if (stringIsEmpty(defaultSettings.carResetDelay)) outCfgLines.push("#");
            outCfgLines.push(`car_reset_delay=${defaultSettings.carResetDelay}\n`);

            outCfgLines.push(
                `# Disable speed limit for players that drive the wrong way`
            );
            if (stringIsEmpty(defaultSettings.disableWrongWayLimiter))
                outCfgLines.push("#");
            outCfgLines.push(
                `wrong_way_limiter_disabled=${defaultSettings.disableWrongWayLimiter}\n`
            );

            outCfgLines.push(
                `# Set event weather, list available weather names with command: weathers`
            );
            if (stringIsEmpty(defaultSettings.weatherId)) outCfgLines.push("#");
            outCfgLines.push(`weather=${defaultSettings.weatherId}\n`);
        }

        outCfgLines.push(`# Event Loop (el) settings.
#-------------------------------------------------------------------------------
#  If enabled, server will automatically rotate pre-configured events.
#  Using "el_add=trackname" you can add as many events to the rotation as you wish.
#  List available track names with command: Tracklist
#  Note that "el_*" parameters override corresponding global settings for the event.
#  Remove the first # from setup parameters to enable.
#  Use the console command /eventloop to enable/disable rotation.\n`);

        for (let i = 0; i < eventList.length; i++)
        {
            const trackConfigurationIndex = eventList[i];
            const trackConfiguration = trackPool[trackConfigurationIndex];

            await outCfgLines.push(
                `# ${trackConfiguration.commentTitle} (Base Map: ${trackConfiguration.baseMap}, Track Length Group: ${trackConfiguration.trackLengthGroup})`
            );
            await outCfgLines.push(`el_add=${trackConfiguration.trackId}`);

            if (!stringIsEmpty(trackConfiguration.laps))
                await outCfgLines.push(`el_laps=${trackConfiguration.laps}`);
            if (!stringIsEmpty(trackConfiguration.gameMode))
                await outCfgLines.push(`el_gamemode=${trackConfiguration.gameMode}`);
            if (!stringIsEmpty(trackConfiguration.teamCount))
                await outCfgLines.push(`el_num_teams=${trackConfiguration.teamCount}`);
            if (!stringIsEmpty(trackConfiguration.botCount))
                await outCfgLines.push(`el_bots=${trackConfiguration.botCount}`);
            if (!stringIsEmpty(trackConfiguration.car_reset_disabled))
                await outCfgLines.push(
                    `el_car_reset_disabled=${trackConfiguration.car_reset_disabled}`
                );
            if (!stringIsEmpty(trackConfiguration.car_reset_delay))
                await outCfgLines.push(
                    `el_car_reset_delay=${trackConfiguration.car_reset_delay}`
                );
            if (!stringIsEmpty(trackConfiguration.disableWrongWayLimiter))
                await outCfgLines.push(
                    `el_wrong_way_limiter_disabled=${trackConfiguration.disableWrongWayLimiter}`
                );
            if (!stringIsEmpty(trackConfiguration.classRestriction))
                await outCfgLines.push(
                    `el_car_class_restriction=${trackConfiguration.classRestriction}`
                );
            if (!stringIsEmpty(trackConfiguration.carRestriction))
                await outCfgLines.push(
                    `el_car_restriction=${trackConfiguration.carRestriction}`
                );
            if (!stringIsEmpty(trackConfiguration.carRestriction))
                await outCfgLines.push(
                    `el_special_vehicles_disabled=${trackConfiguration.carRestriction}`
                );
            if (!stringIsEmpty(trackConfiguration.weatherId))
                await outCfgLines.push(`el_weather=${trackConfiguration.weatherId}`);
            if (!stringIsEmpty(trackConfiguration.disableSpecialVehicles))
                await outCfgLines.push(
                    `el_special_vehicles_disabled=${trackConfiguration.disableSpecialVehicles}\n`
                );
            if (!stringIsEmpty(trackConfiguration.timeLimit))
                await outCfgLines.push(`el_time_limit=${trackConfiguration.timeLimit}`);
            if (!stringIsEmpty(trackConfiguration.eliminationInterval))
                await outCfgLines.push(
                    `el_elimination_interval=${trackConfiguration.eliminationInterval}`
                );

            await outCfgLines.push("");
        }
    }
    catch (error)
    {
        console.error(error);
    }

    return outCfgLines.join("\n");
}