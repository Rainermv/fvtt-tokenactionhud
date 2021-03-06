import { RollHandler } from '../rollHandler.js';
import * as settings from '../../settings.js';

export class RollHandlerBaseWfrp4e extends RollHandler {
    constructor() {
        super();
    }
    
    handleActionEvent(event, encodedValue) {
        let payload = encodedValue.split('|');
        settings.Logger.debug(encodedValue);
        if (payload.length != 3) {
            super.throwInvalidValueErr();
        }
        
        let macroType = payload[0];
        let tokenId = payload[1];
        let actionId = payload[2];

        let actor = super.getActor(tokenId);
        let bypassData = {bypass: !!event.shiftKey};

        if (macroType === 'characteristic')
            return actor.setupCharacteristic(actionId, bypassData);

        let item = actor.getOwnedItem(actionId);
        let itemData = item.data;

        let postItem = event.originalEvent.button === 2;
        if (postItem)
            return item.postItem();

        switch (macroType) {
            case 'weapon':
                return actor.setupWeapon(itemData, bypassData);
            case 'spell':
                return actor.spellDialog(itemData, bypassData);
            case 'prayer':
                return actor.setupPrayer(itemData, bypassData);
            case 'trait':
            case 'talent':
                if (itemData.data.rollable?.value)
                    return actor.setupTrait(itemData, bypassData);
                else 
                    return item.postItem();
            case 'skill':
                return actor.setupSkill(itemData, bypassData);
        }
    }
}
