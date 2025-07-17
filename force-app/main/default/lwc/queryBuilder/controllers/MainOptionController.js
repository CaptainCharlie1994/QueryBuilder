export default class MainOptionController{

    /**
     * @param {IMainOptionHanlder} mainOptionHandler
     * 
     */

    constructor(mainOptionHandler){
        this.options = mainOptionHandler;
    }

    /**
   * Builds options via the injected service.
   * @returns {Promise<string[]>}
   */

    async buildOptions(fields){
        return this.options.buildMainOptions(fields);
    }

}