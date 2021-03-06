import * as settings from './settings.js';
import { HandlersManager } from './handlersManager.js';
import { TokenActionHUD } from './tokenactionhud.js';
import { FilterManager } from './actions/filter/filterManager.js';

Hooks.on('init', () => {
    Handlebars.registerHelper('cap', function(string) {
        if (!string || string.length < 1)
            return '';
        return string[0].toUpperCase() + string.slice(1); 
    });

    loadTemplates([
        'modules/token-action-hud/templates/category.hbs',
        'modules/token-action-hud/templates/subcategory.hbs',
        'modules/token-action-hud/templates/action.hbs'
    ]);

    let system = game.data.system.id;
    let rollHandlers = HandlersManager.getRollHandlerChoices(system);

    settings.registerSettings(system, rollHandlers);
});

Hooks.on('canvasReady', () => {

    if (!game.tokenActionHUD) {
        let system = game.data.system.id;
        let user = game.user;
        let filterManager = new FilterManager(user);
        let actionHandler = HandlersManager.getActionHandler(system, filterManager);
        
        let handlerId = settings.get('rollHandler');
        
        if (! (handlerId === 'core' || game.modules.get(handlerId).active) ) {
            settings.Logger.error(handlerId, game.i18n.localize('tokenactionhud.handlerNotFound'));
            handlerId = 'core';
            settings.set('rollHandler', handlerId);
        }

        let rollHandler = HandlersManager.getRollHandler(system, handlerId);
        
        game.tokenActionHUD = new TokenActionHUD(actionHandler, rollHandler, filterManager);
    }
    
    game.tokenActionHUD.setTokensReference(canvas.tokens);

    Hooks.on('controlToken', (token, controlled) => {
        if (game.tokenActionHUD.validTokenChange())
            game.tokenActionHUD.update();
    });
    
    Hooks.on('updateToken', (scene, token, diff, options, idUser) => {
        // If it's an X or Y change assume the token is just moving.
        if (diff.hasOwnProperty('y') || diff.hasOwnProperty('x'))
            return;
        if (game.tokenActionHUD.validTokenChange())
            game.tokenActionHUD.update();
    });
    
    Hooks.on('deleteToken', (scene, token, change, userId) => {
        if (game.tokenActionHUD.validTokenChange())
            game.tokenActionHUD.update();
    });
    
    Hooks.on('hoverToken', (token, hovered) => {
        if (game.tokenActionHUD.validTokenHover(token, hovered))
            game.tokenActionHUD.update();
    });
    
    Hooks.on('updateActor', (actor) => {
        if (game.tokenActionHUD.validActorOrItemUpdate(actor))
            game.tokenActionHUD.update();
    });
    
    Hooks.on('deleteActor', (actor) => {
        if (game.tokenActionHUD.validActorOrItemUpdate(actor))
            game.tokenActionHUD.update();
    });
    
    Hooks.on('deleteOwnedItem', (source, item) => {
        let actor = source.data;
        if (game.tokenActionHUD.validActorOrItemUpdate(actor))
            game.tokenActionHUD.update();
    });
    
    Hooks.on('createOwnedItem', (source, item) => {
        let actor = source.data;
        if (game.tokenActionHUD.validActorOrItemUpdate(actor))
            game.tokenActionHUD.update();
    });
    
    Hooks.on('updateOwnedItem', (source, item) => {
        let actor = source.data;
        if (game.tokenActionHUD.validActorOrItemUpdate(actor))
            game.tokenActionHUD.update();
    });
    
    Hooks.on('renderTokenActionHUD', () => {
        game.tokenActionHUD.trySetPos();
    });

    Hooks.on('renderCompendium', (source, html, ) => {
        if (game.tokenActionHUD.isLinkedCompendium(source?.metadata?.label))
            game.tokenActionHUD.update();
    });

    Hooks.on('deleteCompendium', (source, html, ) => {
        if (game.tokenActionHUD.isLinkedCompendium(source?.metadata?.label))
            game.tokenActionHUD.update();
    });

    game.tokenActionHUD.update();
});