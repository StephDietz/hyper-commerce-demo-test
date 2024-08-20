import { models } from "@hypermode/functions-as";
import { EmbeddingsModel } from "@hypermode/models-as/models/experimental/embeddings";
import { collections } from "@hypermode/functions-as";
import { getProduct } from "./crud";
import { ProductSearchResult, ProductSearchObject, consts } from "./types";

export function searchProducts(
  query: string,
  maxItems: i32,
  thresholdStars: f32 = 0.0,
): ProductSearchResult {
  const productSearchRes = new ProductSearchResult(
    consts.productNameCollection,
    consts.searchMethod,
    "success",
    "",
  );

  const semanticSearchRes = collections.search(
    consts.productNameCollection,
    consts.searchMethod,
    query,
    maxItems,
    true,
  );

  if (!semanticSearchRes.isSuccessful) {
    productSearchRes.status = semanticSearchRes.status;
    productSearchRes.error = semanticSearchRes.error;

    return productSearchRes;
  }

  const unrankedResults = semanticSearchRes.objects;

  for (let i = 0; i < unrankedResults.length; i++) {
    const searchObj = getSearchObject(
      unrankedResults[i].key,
      unrankedResults[i].score,
      unrankedResults[i].distance,
    );
    productSearchRes.searchObjs.unshift(searchObj);
  }

  return productSearchRes;
}

function getSearchObject(
  key: string,
  score: f64,
  distance: f64,
): ProductSearchObject {
  return new ProductSearchObject(getProduct(key), score, distance);
}

// function reRankAndFilterSearchResultObjects(
//   objs: collections.CollectionSearchResultObject[],
//   thresholdStars: f32,
// ): collections.CollectionSearchResultObject[] {
//   for (let i = 0; i < objs.length; i++) {
//     const starRes = collections.getText(
//       consts.productStarCollection,
//       objs[i].key,
//     );
//     const stars = parseFloat(starRes);

//     const inStockRes = collections.getText(
//       consts.isProductStockedCollection,
//       objs[i].key,
//     );
//     const inStock = inStockRes === "true";

//     if (!inStock) {
//       objs[i].score *= 0.5;
//     }
//     objs[i].score *= stars * 0.1;
//   }

//   objs.sort((a, b) => {
//     if (a.score < b.score) {
//       return -1;
//     } else if (a.score > b.score) {
//       return 1;
//     } else {
//       return 0;
//     }
//   });

//   const filteredResults: collections.CollectionSearchResultObject[] = [];
//   for (let i = 0; i < objs.length; i++) {
//     const starRes = collections.getText(
//       consts.productStarCollection,
//       objs[i].key,
//     );
//     const stars = parseFloat(starRes);
//     if (stars >= thresholdStars) {
//       filteredResults.push(objs[i]);
//     }
//   }

//   return filteredResults;
// }

export function miniLMEmbed(texts: string[]): f32[][] {
  const model = models.getModel<EmbeddingsModel>(consts.embeddingModel);
  const input = model.createInput(texts);
  const output = model.invoke(input);

  return output.predictions;
}
