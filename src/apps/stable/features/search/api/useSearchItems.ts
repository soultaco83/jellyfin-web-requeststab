import type {
    BaseItemDto,
    BaseItemKind
} from '@jellyfin/sdk/lib/generated-client';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../../../hooks/useApi';
import { addSection, getCardOptionsFromType, getItemTypesFromCollectionType, getTitleFromType, isLivetv, isMovies, isMusic, isTVShows, sortSections } from '../utils/search';
import { useArtistsSearch } from './useArtistsSearch';
import { usePeopleSearch } from './usePeopleSearch';
import { useVideoSearch } from './useVideoSearch';
import { Section } from '../types';
import { useLiveTvSearch } from './useLiveTvSearch';
import { fetchItemsByType } from './fetchItemsByType';

export const useSearchItems = (
    parentId?: string,
    collectionType?: CollectionType,
    searchTerm?: string
) => {
    const { data: artists, isPending: isArtistsPending } = useArtistsSearch(parentId, collectionType, searchTerm);
    const { data: people, isPending: isPeoplePending } = usePeopleSearch(parentId, collectionType, searchTerm);
    const { data: videos, isPending: isVideosPending } = useVideoSearch(parentId, collectionType, searchTerm);
    const { data: liveTvSections, isPending: isLiveTvPending } = useLiveTvSearch(parentId, collectionType, searchTerm);
    const { api, user } = useApi();
    const userId = user?.Id;

    const isArtistsEnabled = !isArtistsPending || (collectionType && !isMusic(collectionType));
    const isPeopleEnabled = !isPeoplePending || (collectionType && !isMovies(collectionType) && !isTVShows(collectionType));
    const isVideosEnabled = !isVideosPending || collectionType;
    const isLiveTvEnabled = !isLiveTvPending || !collectionType || !isLivetv(collectionType);

    return useQuery({
        queryKey: ['SearchItems', collectionType, parentId, searchTerm],
        queryFn: async ({ signal }) => {
            const sections: Section[] = [];

            addSection(sections, 'Artists', artists?.Items, {
                coverImage: true
            });

            addSection(sections, 'People', people?.Items, {
                coverImage: true
            });

            addSection(sections, 'HeaderVideos', videos?.Items, {
                showParentTitle: true
            });

            if (liveTvSections) {
                sections.push(...liveTvSections);
            }

            const itemTypes: BaseItemKind[] = getItemTypesFromCollectionType(collectionType);

            const searchData = await fetchItemsByType(
                api!,
                userId,
                {
                    includeItemTypes: itemTypes,
                    parentId: parentId,
                    searchTerm: searchTerm,
                    limit: 800
                },
                { signal }
            );

            if (searchData.Items) {
                for (const itemType of itemTypes) {
                    const items: BaseItemDto[] = [];
                    for (const searchItem of searchData.Items) {
                        if (searchItem.Type === itemType) {
                            items.push(searchItem);
                        }
                    }
                    addSection(sections, getTitleFromType(itemType), items, getCardOptionsFromType(itemType));
                }
            }

            return sortSections(sections);
        },
        enabled: !!api && !!userId && !!isArtistsEnabled && !!isPeopleEnabled && !!isVideosEnabled && !!isLiveTvEnabled
    });
};
