/**
 * @license GNU General Public License v2 http://www.gnu.org/licenses/gpl-2.0
 * @author BlueMöhre <bluemoehre@gmx.de>
 * @copyright 2013 BlueMöhre
 * @link http://www.github.com/bluemoehre
 */

// use window and document as local variables due to performance improvement
(function($, win) {

    'use strict';

    /**
     * Separator between namespace and key
     * You can change it to whatever u need
     * @type {string}
     */
    var SEPARATOR = ':';

    /**
     * Error for separator conflict in key name
     * @type {string}
     */
    var ERR_SEPARATOR_IN_KEY = '"'+SEPARATOR+'" is not allowed in key due it is used as namespace separator';

    /**
     * Collection of jQuery event listeners for each storage
     * @type {{localStorage: (jQuery), sessionStorage: (jQuery)}}
     */
    var eventHandlers = { localStorage: $({}), sessionStorage: $({}) };

    /**
     * Hashes of key value paris for IE workaround
     * @see https://connect.microsoft.com/IE/feedback/details/774798/localstorage-event-fired-in-source-window
     * @type {Array}
     */
    var ieCrutchHashes = [];

    /**
     * Adds a number to the hash list for later testing
     * @see https://connect.microsoft.com/IE/feedback/details/774798/localstorage-event-fired-in-source-window
     * @param {string} key
     * @param {string} data
     */
    function addIeCrutch(key, data){
        // remove all entries for same key
        var i = 0;
        for (; i < ieCrutchHashes.length; i++){
            if (ieCrutchHashes[i].key == key){
                ieCrutchHashes.splice(i, 1);
                i--;
            }
        }
        // limit hash count to 100
        if (i > 99){
            ieCrutchHashes.splice(0, i - 99);
        }

        ieCrutchHashes.push({ key: key, val: hashString(data + '') });
    }

    /**
     * Tests if a hash is on the hash list
     * @param {string} key
     * @param {string} data
     * @returns {boolean}
     */
    function isIeCrutch(key, data){
        for (var i = 0; i < ieCrutchHashes.length; i++){
            if (ieCrutchHashes[i].key == key && ieCrutchHashes[i].val == hashString(data + '')) return true;
        }
        return false;
    }

    /**
     * Hashes a string to a small (negative) number
     * @param {string} string
     * @return {number}
     */
    function hashString(string){
        var hash = 0;
        // faster version (IE9+)
        if (Array.prototype.reduce){
            return parseInt(string.split('').reduce(function(hash, string){
                hash = ((hash << 5) - hash) + string.charCodeAt(0);
                return hash & hash;
            }, 0));
        // slower version (browsers without Array.prototype.reduce)
        } else {
            var char;
            if (string.length === 0) return hash;
            for (var i = 0; i < string.length; i++) {
                char  = string.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
        }
        return hash;
    }

    /**
     * Validates key
     * @param {string} key
     * @throws Exception
     * @returns {undefined}
     */
    function validateKey(key){
        if (!key.indexOf(SEPARATOR) < 0) throw ERR_SEPARATOR_IN_KEY;
    }

    /**
     * Prepends namespace string to key if present
     * @param {string} key
     * @param {string} namespace
     * @returns {string}
     */
    function prefixKey(key, namespace){
        return (namespace ? namespace + SEPARATOR : '') + key;
    }

    /**
     * Merge storage and arguments to an array
     * @param {string} storage
     * @param {Array} args
     * @returns {Array}
     */
    function buildArgs(storage, args){
        return [storage].concat(Array.prototype.slice.call(args, 0));
    }

    /**
     * Returns a value from a storage
     * @param {string} storage
     * @param {string} [namespace]
     * @param {string} key
     * @returns {*}
     */
    function get(storage, namespace, key){
        storage = arguments[0];
        key = arguments[arguments.length-1];
        namespace = arguments.length > 2 ? arguments[arguments.length-2] : null;
        validateKey(key);
        return JSON.parse(win[storage].getItem(prefixKey(key,namespace)));
    }

    /**
     * Saves a value to a storage
     * @param {string} storage
     * @param {string} [namespace]
     * @param {string} key
     * @param {*} value
     * @returns {undefined}
     */
    function set(storage, namespace, key, value){
        storage = arguments[0];
        value = arguments[arguments.length-1];
        key = arguments[arguments.length-2];
        namespace = arguments.length > 3 ? arguments[arguments.length-3] : null;
        validateKey(key);
        key = prefixKey(key, namespace);
        if (value === null){
            addIeCrutch(key, '');
            win[storage].removeItem(key);
        } else {
            value = JSON.stringify(value);
            addIeCrutch(key, value);
            win[storage].setItem(key, value);
        }
    }

    /**
     * Removes a value from a storage
     * @param {string} storage
     * @param {string} [namespace]
     * @param {string} key
     * @returns {undefined}
     */
    function del(storage, namespace, key){
        storage = arguments[0];
        key = arguments[arguments.length-1];
        namespace = arguments.length > 2 ? arguments[arguments.length-2] : null;
        validateKey(key);
        key = prefixKey(key,namespace);
        addIeCrutch(key, '');
        win[storage].removeItem(key);
    }

    /**
     * Clears the complete storage or just a namespace
     * @param {string} storage
     * @param {string} [namespace]
     */
    function clear(storage, namespace){
        if (namespace){
            var keysToRemove = [];
            var i;
            for (i = 0; i < win[storage].length; i++){
                var key = win[storage].key(i);
                if (key.indexOf(namespace + SEPARATOR) == 0) keysToRemove.push(key);
            }
            for (i = 0; i < keysToRemove.length; i++){
                addIeCrutch(keysToRemove[i], '');
                win[storage].removeItem(keysToRemove[i]);
            }
        } else {
            ieCrutchHashes = [];
            win[storage].clear();
        }
    }

    /**
     * Binds a function for the specified events (jQuery-like)
     * @param {string} storage
     * @param {string} event
     * @param {function} handler
     */
    function on(storage, event, handler){
        eventHandlers[storage].on(event, handler);
    }

    /**
     * Unbinds a function for the specified events (jQuery-like)
     * @param {string} storage
     * @param {string} event
     * @param {function} [handler]
     */
    function off(storage, event, handler){
        eventHandlers[storage].off(event, handler);
    }

    /**
     * Binds a function for the specified events once (jQuery-like)
     * @param {string} storage
     * @param {string} event
     * @param {function} [handler]
     */
    function one(storage, event, handler){
        eventHandlers[storage].one(event, handler);
    }

    /**
     * Calls all bound event handlers for the specified events (jQuery-like)
     * @param {string} storage
     * @param {string} event
     * @param {*} [data]
     */
    function trigger(storage, event, data){
        eventHandlers[storage].trigger(event, data);
    }


    // If dependencies are met setup all available functions
    if ('sessionStorage' in win && 'localStorage' in win && 'JSON' in win){

        $.sessionStorage = {
            get: function(){
                return get.apply(null, buildArgs('sessionStorage', arguments));
            },
            set: function(){
                set.apply(null, buildArgs('sessionStorage', arguments));
            },
            del: function(){
                del.apply(null, buildArgs('sessionStorage', arguments));
            },
            clear: function(){
                clear.apply(null, buildArgs('sessionStorage', arguments));
            },
            on: function(){
                on.apply(null, buildArgs('sessionStorage', arguments));
            },
            off: function(){
                off.apply(null, buildArgs('sessionStorage', arguments));
            },
            one: function(){
                one.apply(null, buildArgs('sessionStorage', arguments));
            },
            trigger: function(){
                trigger.apply(null, buildArgs('sessionStorage', arguments));
            }
        };

        $.localStorage = {
            get: function(){
                return get.apply(null, buildArgs('localStorage', arguments));
            },
            set: function(){
                set.apply(null, buildArgs('localStorage', arguments));
            },
            del: function(){
                del.apply(null, buildArgs('localStorage', arguments));
            },
            clear: function(){
                clear.apply(null, buildArgs('localStorage', arguments));
            },
            on: function(){
                on.apply(null, buildArgs('localStorage', arguments));
            },
            off: function(){
                off.apply(null, buildArgs('localStorage', arguments));
            },
            one: function(){
                one.apply(null, buildArgs('localStorage', arguments));
            },
            trigger: function(){
                trigger.apply(null, buildArgs('localStorage', arguments));
            }
        };

        // Catch native storage event and trigger the plug-in's ones
        $(win).on('storage', function(event){
            if (!isIeCrutch(event.originalEvent.key, event.originalEvent.newValue)){
                $.localStorage.trigger({
                    type: 'storage',
                    originalEvent: event.originalEvent
                });
            }
        });

    }

    // If dependencies are not met, register empty functions to not break the rest of the code
    else {

        $.sessionStorage = $.localStorage = {
            get: function(){ return null; },
            set: $.noop,
            del: $.noop,
            clear: $.noop,
            on: $.noop,
            off: $.noop,
            one: $.noop,
            trigger: $.noop
        };

    }

    // Alias
    $.webStorage = {
        session: $.sessionStorage,
        local: $.localStorage
    };

})(jQuery, window);
