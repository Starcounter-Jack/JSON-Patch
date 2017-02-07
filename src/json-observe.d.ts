/** Class representing a JS Object observer  */
declare class JsonObserver {
    private deepClone(obj);
    private originalObject;
    private exposedObject;
    private cachedProxy;
    private patches;
    private isRecording;
    private defaultCallback;
    userCallback: Function;
    /**
    * Disables recording and/or callback firing when object modifications happen.
    * @param {boolean} enable - true will enable, false will disable.
    */
    switchObserverOff: Function;
    /**
    * Enables recording and/or callback firing when object modifications happen.
    * @param {boolean} enable - true will enable, false will disable.
    */
    switchObserverOn: Function;
    private escapePathComponent(str);
    private generateProxyAtPath(obj, path);
    private _proxifyObjectTreeRecursively(root, path);
    private proxifyObjectTree(root);
    constructor(root: any);
    /**
     * Proxifies the object that was passed in the constructor and returns a proxified mirror of it.
     * @param {boolean} record - whether to record object changes to a later-retrievable patches array.
     * @param {function} [callback] - this will be synchronously called with every object change.
     */
    observe(record: any, callback: any): any;
    /**
     * If the observed is set to record, it will synchronously return all the patches and empties patches array.
     */
    generate(): Object[];
    /**
     * Synchronously de-proxifies the last state of the object and returns it unobserved.
     */
    unobserve(): any;
}
export default JsonObserver;
