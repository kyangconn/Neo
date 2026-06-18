/**
 * Copyright (c) 2025 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RNPackageContext, RNOHPackage } from '@rnoh/react-native-openharmony';
import { createRNOHPackages as createRNOHPackagesAutolinking } from "./RNOHPackagesFactory";
import GestureHandlerPackage from '@react-native-ohos/react-native-gesture-handler';
import {SafeAreaViewPackage} from '@react-native-ohos/react-native-safe-area-context/ts';

export function getRNOHPackages(ctx: RNPackageContext): RNOHPackage[] {
  return [
    new SafeAreaViewPackage(ctx),
    new GestureHandlerPackage(ctx),
    ...createRNOHPackagesAutolinking(ctx),
  ]
}
