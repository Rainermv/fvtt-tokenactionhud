import {ActionHandler} from '../actionHandler.js';

export class ActionHandlerWfrp extends ActionHandler {
    constructor(filterManager) {
        super();

        this.filterManager = filterManager;
        filterManager.createFilter('skills');
    }    

    /** @override */
    async buildActionList(token) {
        let result = this.initializeEmptyActionList();

        if (!token)
            return result;

        let tokenId = token.data._id;

        result.tokenId = tokenId;

        let actor = token.actor;

        if (!actor)
            return result;

        result.actorId = actor._id;
        
        let weapons = this._getItemsList(actor, tokenId, 'weapon');
        let characteristics = this._getCharacteristics(actor, tokenId);

        let filteredNames = this.filterManager.getFilteredNames('skills');
        let skills = this._getSkills(actor, tokenId, filteredNames);
        
        let magic = this._getSpells(actor, tokenId);
        let prayers = this._getPrayers(actor, tokenId);
        let talents = this._getTalents(actor, tokenId);
        let traits = this._getTraits(actor, tokenId);

        [filteredNames, skills, magic, prayers, talents, traits].forEach(c => this.filterManager.setCanFilter(c));
        
        this._combineCategoryWithList(result, this.i18n('tokenactionhud.weapons'), weapons);
        this._combineCategoryWithList(result, this.i18n('tokenactionhud.characteristics'), characteristics);
        this._combineCategoryWithList(result, this.i18n('tokenactionhud.skills'), skills);
        this._combineCategoryWithList(result, this.i18n('tokenactionhud.magic'), magic);
        this._combineCategoryWithList(result, this.i18n('tokenactionhud.religion'), prayers);
        this._combineCategoryWithList(result, this.i18n('tokenactionhud.talents'), talents);
        this._combineCategoryWithList(result, this.i18n('tokenactionhud.traits'), traits);

        this._setFilterSuggestions(actor);
        return result;
    }

    /** @override */
    _setFilterSuggestions(actor) {
        let skillSuggestions = actor.items.filter(i => i.type === 'skill').map(s => { return { id: s._id, value: s.name } })
        this.filterManager.setSuggestions('skills', skillSuggestions);
    }

    _getItemsList(actor, tokenId, type) {
        let types = type+'s';
        let result = this.initializeEmptyCategory('items');

        let subcategory = this.initializeEmptySubcategory();
        subcategory.actions = this._produceMap(tokenId ,actor.items.filter(i => i.type == type), type);

        this._combineSubcategoryWithCategory(result, types, subcategory);

        return result;
    }

    _getCharacteristics(actor, tokenId) {
        let result = this.initializeEmptyCategory('characteristics');
        let macroType = 'characteristic';

        let characteristics = Object.entries(actor.data.data.characteristics);
        let characteristicsCategory = this.initializeEmptySubcategory();
        characteristicsCategory.actions = characteristics.map(c => {
            let encodedValue = [macroType, tokenId, c[0]].join(this.delimiter);
            return {name: this.i18n(c[1].abrev), encodedValue: encodedValue, id:c[0]}
        })

        this._combineSubcategoryWithCategory(result, this.i18n('tokenactionhud.characteristics'), characteristicsCategory);

        return result;
    }

    _getSkills(actor, tokenId, filteredNames) {
        let categoryId = 'skills';
        let macroType = 'skill';
        
        let result = this.initializeEmptyCategory(categoryId);
        
        let skills = actor.items.filter(i => i.type === macroType && i._id);

        result.choices = skills.length;

        if (filteredNames.length > 0) {
            if (this.filterManager.isBlocklist(categoryId)) {
                skills = skills.filter(s => !filteredNames.includes(s.name));
            }
            else {
                skills = skills.filter(s => filteredNames.includes(s.name));
            }
        }        

        let meleeSkills = skills.filter(s => s.data.name.startsWith('Melee'));
        let meleeCategory = this.initializeEmptySubcategory();
        meleeCategory.actions = this._produceMap(tokenId, meleeSkills, macroType);

        let rangedSkills = skills.filter(s => s.data.name.startsWith('Ranged'));
        let rangedCategory = this.initializeEmptySubcategory();
        rangedCategory.actions = this._produceMap(tokenId, rangedSkills, macroType);

        let basicSkills = skills.filter(s => !(s.data.name.startsWith('Melee') || s.data.name.startsWith('Ranged'))  && s.data.data.grouped.value !== 'isSpec');
        let basicSkillsCat = this.initializeEmptySubcategory();
        basicSkillsCat.actions = this._produceMap(tokenId, basicSkills, macroType);

        let advancedSkills = skills.filter(s => !(s.data.name.startsWith('Melee') || s.data.name.startsWith('Ranged')) && s.data.data.grouped.value === 'isSpec');
        let advancedSkillsCat = this.initializeEmptySubcategory();
        advancedSkillsCat.actions = this._produceMap(tokenId, advancedSkills, macroType);
        
        this._combineSubcategoryWithCategory(result, this.i18n('tokenactionhud.melee'), meleeCategory);
        this._combineSubcategoryWithCategory(result, this.i18n('tokenactionhud.ranged'), rangedCategory);
        this._combineSubcategoryWithCategory(result, this.i18n('tokenactionhud.basic'), basicSkillsCat);
        this._combineSubcategoryWithCategory(result, this.i18n('tokenactionhud.advanced'), advancedSkillsCat);

        return result;
    }

    _getSpells(actor, tokenId) {
        let macroType = 'spell';
        let result = this.initializeEmptyCategory('spells');

        let spells = actor.items.filter(i => i.type === macroType);
        
        let petties = spells.filter(i => i.data.data.lore.value === 'petty');
        let pettyCategory = this.initializeEmptySubcategory();
        pettyCategory.actions = this._produceMap(tokenId, petties, macroType);

        this._combineSubcategoryWithCategory(result, this.i18n('tokenactionhud.petty'), pettyCategory);

        let lores = spells.filter(i => i.data.data.lore.value !== 'petty');
        let loresCategorised = lores.reduce((output, spell) => {
            let loreType = spell.data.data.lore.value;
            if (!output.hasOwnProperty(loreType)) {
                output[loreType] = [];
            }

            output[loreType].push(spell);

            return output;
        }, {});

        Object.entries(loresCategorised).forEach(loreCategory => {
            let subcategory = this.initializeEmptySubcategory();
            subcategory.actions = this._produceMap(tokenId, loreCategory[1], macroType);
            this._combineSubcategoryWithCategory(result, loreCategory[0], subcategory);
        })

        return result;
    }

    _getPrayers(actor, tokenId) {
        let macroType = 'prayer';
        let result = this.initializeEmptyCategory('prayers');

        let prayers = actor.items.filter(i => i.type === macroType);
        
        let blessings = prayers.filter(i => i.data.data.type.value === 'blessing');
        let blessingCategory = this.initializeEmptySubcategory();
        blessingCategory.actions = this._produceMap(tokenId, blessings, macroType);

        this._combineSubcategoryWithCategory(result, this.i18n('tokenactionhud.blessing'), blessingCategory);

        let miracles = prayers.filter(i => i.data.data.type.value !== 'blessing');
        let miraclesCategorised = miracles.reduce((output, prayer) => {
            let miracleType = prayer.data.data.type.value;
            if (!output.hasOwnProperty(miracleType)) {
                output[miracleType] = [];
            }

            output[miracleType].push(prayer);

            return output;
        }, {});

        Object.entries(miraclesCategorised).forEach(miracleCategory => {
            let subcategory = this.initializeEmptySubcategory();
            subcategory.actions = this._produceMap(tokenId, miracleCategory[1], macroType);
            this._combineSubcategoryWithCategory(result, miracleCategory[0], subcategory);
        })

        return result;
    }
    
    _getTalents(actor, tokenId) {
        let macroType = 'talent';
        let result = this.initializeEmptyCategory('talents');

        let talents = actor.items.filter(i => i.data.type === macroType);

        let rollableTalents = talents.filter(t => t.data.data.rollable?.value);
        let rollableCategory = this.initializeEmptySubcategory();
        rollableCategory.actions = this._produceMap(tokenId, rollableTalents, macroType);
        
        let unrollableTalents = talents.filter(t => !t.data.data.rollable?.value);
        let unrollableCategory = this.initializeEmptySubcategory();
        unrollableCategory.actions = this._produceMap(tokenId, unrollableTalents, macroType);
        
        this._combineSubcategoryWithCategory(result, this.i18n('tokenactionhud.rollable'), rollableCategory);
        this._combineSubcategoryWithCategory(result, this.i18n('tokenactionhud.unrollable'), unrollableCategory);
        
        return result;
    }

    _getTraits(actor, tokenId) {
        let macroType = 'trait';
        let result = this.initializeEmptyCategory('traits');

        let traits = actor.items.filter(i => i.data.type === macroType);

        let rollableTraits = traits.filter(t => t.data.data.rollable?.value);
        let rollableCategory = this.initializeEmptySubcategory();
        rollableCategory.actions = this._produceMap(tokenId, rollableTraits, macroType);
        
        let unrollableTraits = traits.filter(t => !t.data.data.rollable?.value);
        let unrollableCategory = this.initializeEmptySubcategory();
        unrollableCategory.actions = this._produceMap(tokenId, unrollableTraits, macroType);
        
        this._combineSubcategoryWithCategory(result, this.i18n('tokenactionhud.rollable'), rollableCategory);
        this._combineSubcategoryWithCategory(result, this.i18n('tokenactionhud.unrollable'), unrollableCategory);

        return result;
    }

    _produceMap(tokenId, itemSet, type) {
        return itemSet.map(i => {
            let encodedValue = [type, tokenId, i._id].join(this.delimiter);
            return { name: i.name, encodedValue: encodedValue, id: i._id };
        });
    }   
}