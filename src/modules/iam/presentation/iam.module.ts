import { DynamicModule, Module } from "@nestjs/common";
import { PassportModule } from '@nestjs/passport';
import { configProviders, mcpConfigProviders, mcpServiceProviders, repositoryProviders, serviceProviders, strategyProviders, useCasesProviders } from "./iam.provider";
import { AuthController, UserController } from "./http";
import { IAM_DI_TOKENS } from "../infrastructure";
import { AppConfigProvider } from "src/shared";
import { BearerAuthGuard } from "./http/guards/bearer-auth.guard";

const imports = [PassportModule.register({ defaultStrategy: 'jwt-access' })];
const providers = [AppConfigProvider, ...repositoryProviders, ...serviceProviders, ...configProviders, ...useCasesProviders, ...strategyProviders];
const exportsList = [...repositoryProviders, ...serviceProviders, ...configProviders, ...useCasesProviders, PassportModule, IAM_DI_TOKENS.SERVICES.USER];
const mcpProviders = [...mcpConfigProviders, ...mcpServiceProviders, BearerAuthGuard];
const mcpExports = [
  IAM_DI_TOKENS.CONFIGS.JWT,
  IAM_DI_TOKENS.SERVICES.JWT,
  BearerAuthGuard,
];
const httpControllers = [AuthController, UserController];
@Module({})
export class IamModule {
  static forApi(): DynamicModule {
    return {
      module: IamModule,
      imports,
      controllers: httpControllers,
      providers,
      exports: exportsList,
    };
  }

  static forWorker(): DynamicModule {
    return {
      module: IamModule,
      imports,
      controllers: [],
      providers,
      exports: exportsList,
    };
  }

  static forProviders(): DynamicModule {
    return {
      module: IamModule,
      imports,
      providers,
      exports: exportsList,
    };
  }

  static forMcp(): DynamicModule {
    return {
      module: IamModule,
      providers: mcpProviders,
      exports: mcpExports,
    };
  }
}
