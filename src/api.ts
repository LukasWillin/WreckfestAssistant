// import { parse } from ""; //"../node_modules/csv/dist/esm/index";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import csv from "csvtojson";
import { groupBy, isNumeric, stringIsEmpty, substringSplit } from "./extensions";

//#region Types
export interface IReadCsvResult
{ 
    tracks: Track[],
    defaultSettings: Track | null
}

export interface IRawEvent
{
    debugOutput: any,
    eventList: number[]
}

export class BaseMap
{
    public name: string;
    public count: number = 0;
    public minSpaceBetween: number = 0;

    public constructor(map: string)
    {
        this.name = map;
    }

    public init(eventListLength: number)
    {
        const float = eventListLength / this.count;
        this.minSpaceBetween = Math.floor(float) - 1;
    }
}

export interface TrackRecord
{
    trackId: string;
    mapTitle: string;
    count: number;
    trackLength: number;
    banger: string;
    arena: string;
    laps: number | undefined;
    classRestriction: string | undefined;
    disableWrongWayLimiter: string;
    weatherId: string | undefined;
    gameMode: string | undefined;
    botCount: number | undefined;
    carRestriction: string | undefined;
    teamCount: number | undefined;
    timeLimit: number | undefined;
    eliminationInterval: number | undefined;
    disableSpecialVehicles: string;
    carResetDelay: number | undefined;
    carResetDisabled: string;
}

export class Track
{
    public trackId!: string;
    public mapTitle!: string;
    public baseMap!: string;

    public count: number = 0;
    public trackLength!: number;
    public trackLengthGroup!: "short" | "medium" | "long" | "arena";
    public banger!: string;
    public arena!: string;

    public classRestriction!: string | undefined;
    public disableWrongWayLimiter!: boolean | undefined;
    public laps!: number | undefined;
    public weatherId!: string | undefined;
    public gameMode!: unknown | undefined;
    public botCount!: number | undefined;
    public carRestriction!: unknown | undefined;
    public teamCount!: number | undefined;
    public timeLimit!: number | undefined;
    public eliminationInterval!: number | undefined;
    public disableSpecialVehicles!: boolean | undefined;
    public carResetDelay!: number | undefined;
    public carResetDisabled!: boolean | undefined;

    public get isDefault(): boolean
    {
        return this.trackId === "default";
    }

    public get commentTitle(): string
    {
        return `${this.mapTitle ?? ""} ${!stringIsEmpty(this.banger)
            ? this.banger
            : !stringIsEmpty(this.arena)
                ? this.arena
                : ""
        } - ${isNumeric(this.trackLength)
            ? this.trackLength + " km"
            : this.trackLength
        }`;
    }

    public static fromCSV(record: TrackRecord): Track
    {
        const track = new Track();

        track.trackId = record.trackId;
        track.baseMap = substringSplit(record.trackId, "_", 1)[0];
        track.mapTitle = record.mapTitle;

        record.count = track.count = isNumeric(record.count)
            ? Math.floor(Number.parseFloat(record.count as unknown as string) + 0.5)
            : 0;
        record.trackLength = track.trackLength = isNumeric(record.trackLength)
            ? Number.parseFloat(record.trackLength as unknown as string)
            : -1;
        record.laps = track.laps = isNumeric(record.laps)
            ? Math.floor(Number.parseFloat(record.laps as unknown as string))
            : undefined;
        
        if (track.trackLength > 0)
        {
            // These arbitrarily set numbers account to roughly the same number of tracks in each group as of 2022.10.12
            if (track.trackLength < 1.05) 
                track.trackLengthGroup = "short"; // 32
            else if (track.trackLength < 1.8)
                track.trackLengthGroup = "medium"; // 34
            else 
                track.trackLengthGroup = "long"; // 32
        }
        else
        {
            track.trackLengthGroup = "arena";
        }

        track.arena = record.arena;
        track.banger = record.banger;
        track.botCount = record.botCount;
        track.carResetDisabled = Number.parseInt(record.carResetDisabled) > 0 ? true: false;
        track.carResetDelay = record.carResetDelay;
        track.carRestriction = record.carRestriction;
        track.classRestriction = record.classRestriction;
        track.disableSpecialVehicles = Number.parseInt(record.disableSpecialVehicles) > 0 ? true : false;
        track.disableWrongWayLimiter = Number.parseInt(record.disableWrongWayLimiter) > 0 ? true: false;
        track.eliminationInterval = record.eliminationInterval;
        track.weatherId = record.weatherId;
        track.gameMode = record.gameMode;
        track.teamCount= record.teamCount;
        track.timeLimit = record.timeLimit;

        return track;
    }

    public toCFGLines(): string[]
    {
        const outCfgLines = [];
        
        outCfgLines.push(
            `# ${this.commentTitle} (Base Map: ${this.baseMap}, Track Length Group: ${this.trackLengthGroup})`
        );
        outCfgLines.push(`el_add=${this.trackId}`);

        if (!stringIsEmpty(this.laps))
            outCfgLines.push(`el_laps=${this.laps}`);
        if (!stringIsEmpty(this.gameMode))
            outCfgLines.push(`el_gamemode=${this.gameMode}`);
        if (!stringIsEmpty(this.teamCount))
            outCfgLines.push(`el_num_teams=${this.teamCount}`);
        if (!stringIsEmpty(this.botCount))
            outCfgLines.push(`el_bots=${this.botCount}`);
        if (this.carResetDisabled)
            outCfgLines.push(
                `el_car_reset_disabled=1`
            );
        if (!stringIsEmpty(this.carResetDelay))
            outCfgLines.push(
                `el_car_reset_delay=${this.carResetDelay}`
            );
        if (this.disableWrongWayLimiter)
            outCfgLines.push(
                `el_wrong_way_limiter_disabled=1`
            );
        if (!stringIsEmpty(this.classRestriction))
            outCfgLines.push(
                `el_car_class_restriction=${this.classRestriction}`
            );
        if (!stringIsEmpty(this.carRestriction))
            outCfgLines.push(
                `el_car_restriction=${this.carRestriction}`
            );
        if (this.disableSpecialVehicles)
            outCfgLines.push(
                `el_special_vehicles_disabled=1`
            );
        if (!stringIsEmpty(this.weatherId))
            outCfgLines.push(`el_weather=${this.weatherId}`);

        if (!stringIsEmpty(this.timeLimit))
            outCfgLines.push(`el_time_limit=${this.timeLimit}`);
        if (!stringIsEmpty(this.eliminationInterval))
            outCfgLines.push(
                `el_elimination_interval=${this.eliminationInterval}`
            );
        
        return outCfgLines;
    }
}
//#endregion Types

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

export const readCsv = async (csvInput: string, delimiter: string = ";"): Promise<IReadCsvResult> =>
{
    let defaultSettings: Track | null = null;
    let records: any[] = [];

    records = (await new Promise((resolve, reject) =>
    {
        csv({ delimiter: delimiter }).fromString(csvInput)
            .then((value: any[]) => resolve(value), (reason: any) => reject(reason));
    })) ?? [];

    let prevTrackTitle = "";
    records.forEach((record: TrackRecord) =>
    {
        if (!stringIsEmpty(record.mapTitle))
            prevTrackTitle = record.mapTitle;
        else
            record.mapTitle = prevTrackTitle;
    });

    const tracks = records.map(record => Track.fromCSV(record));

    const defaultTrackIndex = tracks.findIndex((t: Track) => t.isDefault);

    defaultSettings = defaultTrackIndex >= 0 ? tracks.splice(defaultTrackIndex, 1)[0] : null;

    return { defaultSettings, tracks };
}

export function prepareTrackPool(tracks: Track[]): { tracks: Track[], maps: BaseMap[], mapLookup: number[] }
{
    // Filter all tracks with count 0 or lower
    tracks = tracks.filter((track: Track) => track.count > 0);
    
    if (tracks.length === 0)
        return { tracks, maps: [], mapLookup: [] };

    // Group maps by base map
    const baseMapGroups = groupBy(tracks, "baseMap");
    const maps = Object.keys(baseMapGroups).map((map: string) => 
    {
        return new BaseMap(map);
    });

    const mapLookup: number[] = [];
    let eventCount = 0;
    for (let i = 0; i < tracks.length; i++)
    {
        const track = tracks[i];
        const mapIndex = maps.findIndex(map => map.name === track.baseMap);
        const map = maps[mapIndex];
        mapLookup[i] = mapIndex;
        (map as BaseMap).count += track.count;
        eventCount += track.count;
    }

    for (let i = 0; i < maps.length; i++)
    {
        const map = maps[i];
        map.init(eventCount);
    }

    return { tracks, maps, mapLookup };
}

function getTrackCount(tracks: Track[]): number
{
    return tracks.map((trackConfig) => trackConfig.count).reduce((prev, curr) => prev + curr);
}

function distributeAtRandom(tracks: Track[], eventList: Array<number>, eventCount: number)
{
    // Fill event list at random
    for (
        let trackIndex = 0;
        trackIndex < tracks.length;
        trackIndex++
    )
    {
        const track = tracks[trackIndex];
        for (let r = 0; r < track.count; r++)
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

            eventList[randomIndex] = trackIndex;
        }
    }
}

function distributeByBaseMap(maps: BaseMap[], tracks: Track[], eventList: Array<number>, eventCount: number, maxPasses: number)
{
    // No base map should follow up twice
    const duplicateMemoryLength = Math.ceil(maps.length * 0.5);

    let dupesFound = true;
    let passes = 0;

    for (passes = 0; passes < maxPasses && dupesFound; passes++)
    {
        const dupeMemory = new Array(duplicateMemoryLength);

        dupesFound = false;

        for (let c = 0; c < eventCount; c++) 
        {
            const i = (c + passes) % eventCount;
            const track = tracks[eventList[i]];

            // If map is not in dupe add then go to next event in list
            if (!dupeMemory.includes(track.baseMap))
            {
                dupeMemory[i % duplicateMemoryLength] = track.baseMap;
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
                swapIndices(eventList, (i + j) % eventCount, (i + j + 1) % eventCount);

            break;
        }
    }
}

function isBaseMapInRange(mapName: string, maps: BaseMap[], mapLookup: number[], eventList: number[], rangeStart: number, rangeEndExcl: number): boolean
{
    for (let i = rangeStart; i < rangeEndExcl; i++)
    {
        const trackIndex = eventList[(i + eventList.length) % eventList.length];
        const map = maps[mapLookup[trackIndex]];
        if (map.name === mapName)
            return true;
    }
    return false;
}

function distributeByBaseMap2(maps: BaseMap[], mapLookup: number[], tracks: Track[], eventList: Array<number>, eventCount: number, maxPasses: number)
{
    let dupesFound = true;
    let passes = 0;
    for (passes = 0; passes < maxPasses && dupesFound; passes++)
    {
        for (let c = 0; c < eventCount; c++) 
        {
            const i = (c + passes) % eventCount;
            const baseMap = maps[mapLookup[eventList[i]]];

            if (!isBaseMapInRange(baseMap.name, maps, mapLookup, eventList, i - baseMap.minSpaceBetween, i))
                continue;

            dupesFound = true;
            swapIndices(eventList, i, (i + 1) % eventCount);
        }
    }
}

function distributeByTrackLengthGroup(maps: BaseMap[], mapLookup: number[], tracks: Track[], eventList: Array<number>, eventCount: number, maxPasses: number)
{
    let dupesFound = true;
    
    for (let passes = 0; passes < maxPasses && dupesFound; passes++)
    {
        let prevLengthGroup = "none";
        dupesFound = false;

        for (let c = 0; c < eventCount; c++) 
        {
            const i = (c + passes) % eventCount;
            const track = tracks[eventList[i]];

            if (prevLengthGroup === track.trackLengthGroup)
            {
                dupesFound = true;
                swapIndices(eventList, i % eventCount, (i + 1) % eventCount);
                break;
            }

            prevLengthGroup = track.trackLengthGroup;
        }
    }
}

function distributeByTrackLength(maps: BaseMap[], mapLookup: number[], tracks: Track[], eventList: Array<number>, eventCount: number, maxPasses: number)
{
    let dupesFound = true;
    
    for (let passes = 0; passes < maxPasses && dupesFound; passes++)
    {
        let prevTrack = null;
        dupesFound = false;

        for (let c = 0; c < eventCount; c++) 
        {
            const i = (c + passes) % eventCount;
            const track = tracks[eventList[i]];
            const trackLengthDiff = Math.abs(prevTrack?.trackLength ?? 0 - track.trackLength);

            // TODO: Get value by analyzing the track list
            if (prevTrack && trackLengthDiff < .65)
            {
                dupesFound = true;
                swapIndices(eventList, i % eventCount, (i + 1) % eventCount);
                break;
            }

            prevTrack = track;
        }
    }
}

/**
 *
 * @param {object[]} tracks
 * @param {boolean} defaultSettings
 * @returns
 */
export async function generateConfigFileByTrackPool(
    tracks: Track[],
    maps: BaseMap[],
    mapLookup: number[]
): Promise<IRawEvent>
{
    if (tracks.length < 1) throw new Error("trackPool is empty");

    // From the count generate a count at which a track appears in the rotation
    // From that count accumulate the total event length
    const eventCount = getTrackCount(tracks);
    // const maxPasses = Math.ceil(eventCount * 150);

    // Store an event list which only contains the indexes of the trackPool
    const eventList = new Array<number>(eventCount);

    // Create an initial random distribution
    distributeAtRandom(tracks, eventList, eventCount);

    for (let passes = 0; passes < 3; passes++)
    {
        distributeByBaseMap2(maps, mapLookup, tracks, eventList, eventCount, eventCount * 100);
        distributeByTrackLength(maps, mapLookup, tracks, eventList, eventCount, eventCount * 200);
        // distributeByTrackLengthGroup(maps, mapLookup, tracks, eventList, eventCount, eventCount * 100);
    }

    distributeByBaseMap2(maps, mapLookup, tracks, eventList, eventCount, eventCount * 100);

    // Output debug information as json into a different file
    // let debugOutput = null;

    // const debugDate = new Date();
    // const debugDupeMemory = new Array(duplicateMemoryLength);
    // let debugAnyNaN = false;
    // let debugAnyEmpty = false;
    // const debugDupeIndizes = [];
    // const debugLengthExceeded = eventList[eventCount] >= 0;

    // for (let i = 0; i < eventCount; i++)
    // {
    //     // Test if empty
    //     if (eventList[i] === undefined) debugAnyEmpty = true;
    //     // Test if Not a Number
    //     else if (!debugAnyNaN && Number.isNaN(eventList[i])) debugAnyNaN = true;

    //     const trackConfiguration = tracks[eventList[i]];

    //     if (debugDupeMemory.includes(trackConfiguration.baseMap))
    //         debugDupeIndizes.push(i);

    //     debugDupeMemory[i % debugDupeMemory.length] = trackConfiguration.baseMap;
    // }

    // debugOutput = {
    //     debugDate,
    //     debugLengthExceeded,
    //     debugAnyNaN,
    //     debugAnyEmpty,
    //     minSpaceBetween: debugDupeMemory.length,
    //     trackPoolCount: tracks.length,
    //     eventCount,
    //     spacingPasses: passes,
    //     debugDupeIndizes,
    //     eventList: eventList.map((trackPoolIndex) => tracks[trackPoolIndex]),
    //     /*debugDupeMemory,*/ 
    // };

    return { debugOutput: {}, eventList };
}

export async function writeCfg(
    defaultSettings: any,
    tracks: any[],
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
            const trackIndex = eventList[i];
            const track = tracks[trackIndex];

            outCfgLines.push(...track.toCFGLines());

            await outCfgLines.push("");
        }
    }
    catch (error)
    {
        console.error(error);
    }

    return outCfgLines.join("\n");
}