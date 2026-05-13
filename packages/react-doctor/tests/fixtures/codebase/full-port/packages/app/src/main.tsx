import "./client";
import "./cycle-a";
import "./consumer-a";
import "./consumer-b";
import "./consumer-c";
import { Button } from "@fixture/ui";
import { helper } from "@app/utils";
import type { LocalThing } from "./type-only";
import leftPad from "left-pad";
import("./dynamic");

type MainThing = LocalThing;

console.log(Button, helper, leftPad);
