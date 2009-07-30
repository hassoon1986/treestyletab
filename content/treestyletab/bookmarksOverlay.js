window.addEventListener('load', function() {
	window.removeEventListener('load', arguments.callee, false);

	eval('PlacesUIUtils._openTabset = '+
		PlacesUIUtils._openTabset.toSource().replace(
			/(function[^\(]*\([^\)]+)(\))/,
			'$1, aFolderTitle$2'
		).replace(
			'var urls = [];',
			'$& var ids = [];'
		).replace(
			'urls.push(item.uri);',
			'$& ids.push(item.id);'
		).replace(
			/(browserWindow\.getBrowser\(\)\.loadTabs\([^;]+\);)/,
			<![CDATA[
				var openGroupBookmarkBehavior = TreeStyleTabService.openGroupBookmarkBehavior();
				var treeStructure = ids.map(function(aId) {
						return ids.indexOf(TreeStyleTabService.getParentItemForBookmark(aId));
					});
				treeStructure = treeStructure.reverse();
				treeStructure = treeStructure.map(function(aPosition, aIndex) {
						if (aIndex > 0 &&
							aIndex < treeStructure.length-1 &&
							aPosition < 0) {
							return treeStructure[aIndex-1];
						}
						return aPosition;
					});
				treeStructure = treeStructure.reverse();
				if (
					where.indexOf('tab') == 0 ||
					aEvent.target.id == 'placesContext_openContainer:tabs' ||
					aEvent.target == aEvent.target.parentNode._endOptOpenAllInTabs ||
					aEvent.target.getAttribute('openInTabs') == 'true'
					) {
					if (openGroupBookmarkBehavior & TreeStyleTabService.kGROUP_BOOKMARK_SUBTREE) {
						if (
							openGroupBookmarkBehavior & TreeStyleTabService.kGROUP_BOOKMARK_USE_DUMMY &&
							treeStructure.filter(function(aParent, aIndex) {
								return aParent == -1 || aIndex == aParent;
							}).length > 1
							) {
							treeStructure.unshift(-1);
							treeStructure = treeStructure.map(function(aPosition) {
									return aPosition == -1 ? -1 : aPosition + 1;
								});
							urls.unshift(TreeStyleTabService.getGroupTabURI(aFolderTitle));
						}
						TreeStyleTabService.readyToOpenNewTabGroup(null, treeStructure);
						replaceCurrentTab = false;
					}
					else {
						replaceCurrentTab = openGroupBookmarkBehavior & TreeStyleTabService.kGROUP_BOOKMARK_REPLACE ? true : false ;
					}
				}
				$1
				]]>
		)
	);

	eval('PlacesUIUtils.openContainerNodeInTabs = '+
		PlacesUIUtils.openContainerNodeInTabs.toSource().replace(
			/(this\._openTabset\([^\)]+)(\))/,
			<![CDATA[
				TreeStyleTabService.getItemIdsForContainerNode(aNode).forEach(function(aId, aIndex) {
					urlsToOpen[aIndex].id = aId;
				});
				$1, aNode.title$2
			]]>
		)
	);

	eval('PlacesUIUtils.openURINodesInTabs = '+
		PlacesUIUtils.openURINodesInTabs.toSource().replace(
			'uri: aNodes[i].uri,',
			'id: aNodes[i].itemId, $&'
		)
	);

	eval('PlacesCommandHook.bookmarkCurrentPages = '+
		PlacesCommandHook.bookmarkCurrentPages.toSource().replace(
			'{',
			<![CDATA[$&
				TreeStyleTabService.beginAddBookmarksFromTabs((function() {
					var tabs = [];
					var seen = {};
					Array.slice(getBrowser().mTabContainer.childNodes).forEach(function(aTab) {
						let uri = aTab.linkedBrowser.currentURI.spec;
						if (uri in seen) return;
						seen[uri] = true;
						tabs.push(aTab);
					});
					return tabs;
				})());
				try {
			]]>
		).replace(
			/(\}\)?)$/,
			<![CDATA[
				}
				catch(e) {
				}
				TreeStyleTabService.endAddBookmarksFromTabs();
			$1]]>
		)
	);

}, false);
