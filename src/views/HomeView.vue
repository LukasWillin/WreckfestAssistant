<template>
  <div class="bg"></div>

  <div class="in-container">
    <textarea class="form in-csv"
        @drop="fileDrop"
        @dragover="dragOverHandler"
        :value="csvInput"></textarea>
    <button class="in-generate btn btn-success">Process</button>
  </div>

  <div class="out-container">
    <textarea class="out-cfg"></textarea>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

@Options({})
export default class HomeView extends Vue 
{
    public csvInput: string = "";

    public async fileDrop(ev: any): Promise<void>
    {
        console.log('File(s) dropped');

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

}
</script>

<style lang="scss">
#drop_zone {
  border: 5px solid blue;
  width: 200px;
  height: 100px;
}
</style>