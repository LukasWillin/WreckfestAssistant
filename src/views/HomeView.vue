<template>
  <div class="bg bg-1"></div>

  <div class="in-container mb-3">
    <label for="in-csv" class="form-label">csv input</label>
    <textarea ref="inCsv"
        id="in-csv"
        class="form-control"
        @drop="fileDrop"
        @dragover="dragOverHandler"
        :value="csvInput"
        @change="inputChangeHandler"
        @keyup="inputChangeHandler"
        placeholder="Drop your .csv-files here or copy the csv content"></textarea><!--@change="() => $forceUpdate()"-->
  </div>

  <div class="ctrl-container mb-3 d-flex justify-content-start">
        <label for="csv-delimiter" class="form-label" v-show="hasInput">Chose Delimiter:</label>
        <select id="csv-delimiter" class="form-control ms-1" v-model="csvDelimiter" v-show="hasInput">
            <option selected="true" value=";">Semicolon ;</option>
            <option value="," >Comma ,</option>
            <option value="&#9;">Tab &#11134;</option>
        </select>
        <i class="unicode-icon ms-4" v-show="hasInput">&#129170;</i>
        <button class="in-generate btn btn-primary ms-3" @click="generate" v-show="hasInput">Generate Event List</button>
        <i class="unicode-icon ms-4" v-show="hasOutput">&#129170;</i>
        <button class="in-generate btn btn-primary ms-3" @click="() => copyContent(cfgOutput)" v-show="hasOutput">Copy to Clipboard</button>
        <button class="in-generate btn btn-primary ms-3" @click="() => download(cfgOutput, 'wreckfest-event-list.cfg', 'text/plain')" v-show="hasOutput">Save as File</button>
  </div>

  <div class="out-container mb-3" v-show="hasOutput">
    <label for="out-cfg" class="form-label">Event List Output</label>
    <textarea ref="outCfg"
        id="out-cfg"
        class="form-control"
        disabled="true"
        v-model="cfgOutput"
        placeholder="Here will be your event list cfg content"></textarea>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { generateConfigFileByTrackPool, prepareTrackPool, readCsv, writeCfg } from "@/api";
import { stringIsEmpty } from "@/extensions";

@Options({})
export default class HomeView extends Vue 
{
    public elInCsv!: HTMLTextAreaElement;
    public elOutCfg!: HTMLTextAreaElement;
    public csvInput: string = "";
    public cfgOutput: string = "";
    public csvDelimiter: string = ";";

    public get hasOutput(): boolean
    {
        return !stringIsEmpty(this.cfgOutput);
    }
    public get hasInput(): boolean
    {
        return !stringIsEmpty(this.csvInput);
    }

    public guessDelimiter()
    {
        if (this.csvInput?.includes("\t")) // Tab variations: "\x09" " 	"
            return this.csvDelimiter = "\t";
        if (this.csvInput?.includes(";"))
            return this.csvDelimiter = ";";
        return this.csvDelimiter = ",";
    }

    public inputChangeHandler()
    {
        this.csvInput = this.elInCsv.value;
        this.guessDelimiter();
        this.$forceUpdate();
    }

    public mounted()
    {
        this.elInCsv = this.$refs.inCsv as HTMLTextAreaElement
        this.elOutCfg = this.$refs.outCfg as HTMLTextAreaElement;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async fileDrop(ev: any): Promise<void>
    {
        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();
        ev.stopPropagation();

        if (ev.dataTransfer.items) 
        {
            // Use DataTransferItemList interface to access the file(s)
            const item = [...ev.dataTransfer.items][0];

            // If dropped items aren't files, reject them
            if (item.kind !== 'file') 
                return;
            const file: File = item.getAsFile();
            // Use DataTransfer interface to access the file(s)
            this.csvInput = await file.text();
            console.log(`file.name = ${file.name}`);
        }
        else
        {
            // Use DataTransfer interface to access the file(s)
            this.csvInput = await ([...ev.dataTransfer.files][0] as File).text();
        }

        this.guessDelimiter();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public dragOverHandler(ev: any): boolean
    {
        // Prevent file from being opened.
        ev.preventDefault();
        ev.stopPropagation();
        return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    public async generate(ev: any): Promise<void>
    {
        const trackData = await readCsv(this.csvInput, this.csvDelimiter);
        const { tracks, maps, mapLookup } = prepareTrackPool(trackData.tracks);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { debugOutput, eventList } = await generateConfigFileByTrackPool(tracks, maps, mapLookup);
        this.cfgOutput = await writeCfg(trackData.defaultSettings, tracks, eventList);
        this.$forceUpdate();
    }

    public download(data: string, filename: string, type: string)
    {
        var file = new Blob([data], {type: type});
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).navigator.msSaveOrOpenBlob) // IE10+
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).navigator.msSaveOrOpenBlob(file, filename);
        else
        { // Others
            var a = document.createElement("a"),
                url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function()
            {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);  
            }, 0); 
        }
    }

    public copyContent(data: string)
    {
        navigator.clipboard.writeText(data);
    }
}
</script>