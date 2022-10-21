<template>
  <div class="bg"></div>

  <div class="in-container mb-3">
    <label for="in-csv" class="form-label">csv input</label>
    <textarea ref="inCsv"
        id="in-csv"
        class="form-control"
        @drop="fileDrop"
        @dragover="dragOverHandler"
        :value="csvInput"
        placeholder="Drop your .csv-files here or copy the csv content"></textarea>
  </div>

  <div class="ctrl-container mb-3 d-flex justify-content-center">
    <button class="in-generate btn btn-primary" @click="generate">Generate Event List</button>
  </div>

  <div class="out-container mb-3">
    <label for="out-cfg" class="form-label">Event List Output</label>
    <textarea ref="outCfg"
        id="out-cfg"
        class="form-control"
        disabled="true"
        placeholder="Here will be your event list cfg content"></textarea>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { generateConfigFileByTrackPool, readCsv, writeCfg } from "@/api";

@Options({})
export default class HomeView extends Vue 
{
    public csvInput: string = "";

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
    }

    public dragOverHandler(ev: any): boolean
    {
        console.log('File(s) in drop zone');

        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();
        ev.stopPropagation();
        return false;
    }

    public async generate(ev: any): Promise<void>
    {
        const textAreaInCsv = this.$refs.inCsv as HTMLTextAreaElement;
        const inputCsv = textAreaInCsv.value;
        
        const { records, defaultSettings } = await readCsv(inputCsv);
        const { debugOutput, trackPool, eventList } = await generateConfigFileByTrackPool(records, defaultSettings);

        const textAreaOutCfg: HTMLTextAreaElement = this.$refs.outCfg as HTMLTextAreaElement;
        textAreaOutCfg.value = await writeCfg(defaultSettings, trackPool, eventList);
    }
}
</script>

<style lang="scss">

</style>