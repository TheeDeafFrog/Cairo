import React, { Component} from "react";
import { Eh } from "./eh/eh";

export class App extends Component{
  render(){
    return(
      <div>
        <h1> Hello, World! </h1>
        <Eh text='hello back'/>
      </div>
    );
  }
}
