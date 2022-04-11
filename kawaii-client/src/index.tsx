import { render } from "@testing-library/react";
import React from "react";
import ReactDOM from "react-dom";
import {Main} from "./screens/main"

const element = <h1>NIGUS</h1>
ReactDOM.render(<Main />, document.getElementById("root"));