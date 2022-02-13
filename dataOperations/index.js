

import { read, readFile, writeFile } from "fs";


const dataPath = "data.json"

const readPath = dataPath;
const writePath = dataPath;
const addSighting = (sighting) => {
    console.log("[addSighting]")

  readFile(readPath, (err,content) => {
    

    const json = JSON.parse(content);
    const newJson = {...json, sightings: [...json.sightings, sighting]};
    const newContent = JSON.stringify(newJson)
    writeFile(writePath,newContent,(err)=>{
      console.log(writePath + "written")
    })
  }
  
  
  )



}

export {
  addSighting
}