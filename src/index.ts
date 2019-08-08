/* export all core functions and types */
export {
    applyOperation,
    applyPatch,
    applyReducer,
    getValueByPointer,
    Operation,
    AddOperation,
    RemoveOperation,
    ReplaceOperation,
    MoveOperation,
    CopyOperation,
    TestOperation,
    GetOperation,
    validate,
    validator,
    OperationResult,
    _areEquals
} from './core.js';

/* export all duplex functions */
export {
    unobserve,
    observe,
    generate,
    compare
} from './duplex.js';

/* export some helpers */
export {
    PatchError as JsonPatchError,
    _deepClone as deepClone,
    escapePathComponent,
    unescapePathComponent
} from './helpers.js';