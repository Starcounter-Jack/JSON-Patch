/**
 * Run using `npm run test-typings`
 * The sole fact that this file compiles means that typings work
 * This follows how DefinitelyTyped tests work
 * @see https://stackoverflow.com/questions/49296151/how-to-write-tests-for-typescript-typing-definition
 */

import jsonpatch from '../../..';
import * as jsonpatchStar from '../../..';
import { applyPatch, Operation } from '../../..';

const document = { firstName: "Albert", contactDetails: { phoneNumbers: [] } };

const typedPatch = new Array<Operation>({ op: "replace", path: "/firstName", value: "Joachim" });
const untypedPatch = [{ op: "replace", path: "/firstName", value: "Joachim" }];

const test_jsonpatch = jsonpatch.applyPatch(document, typedPatch).newDocument;
const test_jsonpatchStar = jsonpatchStar.applyPatch(document, typedPatch).newDocument;
const test_applyPatch = applyPatch(document, typedPatch).newDocument;

// the below line would NOT compile with TSC
// const test_applyPatch = applyPatch(document, untypedPatch).newDocument;