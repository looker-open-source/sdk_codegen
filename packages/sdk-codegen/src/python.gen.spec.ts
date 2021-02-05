/*

 MIT License

 Copyright (c) 2021 Looker Data Sciences, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */

import {
  IAccessToken,
  IDictionary,
  IMergeQuerySourceQuery,
  IRequestAllUsers,
  IRequestCreateQueryTask,
  IWriteLookWithQuery,
  IWriteMergeQuery,
  ISqlQueryCreate,
  ResultFormat,
} from '@looker/sdk'
import { DelimArray } from '@looker/sdk-rtl'
import { TestConfig } from './testUtils'
import { PythonGen } from './python.gen'
import { IEnumType, IType } from './sdkModels'
import { IMappedType } from './codeGen'

const config = TestConfig()
const apiTestModel = config.apiTestModel
const gen = new PythonGen(apiTestModel)
const indent = ''

describe('python generator', () => {
  describe('comment header', () => {
    it('is empty with no comment', () => {
      expect(gen.commentHeader('', '')).toEqual('')
    })

    it('is two lines with a two line comment', () => {
      const expected = `# foo
# bar
`
      expect(gen.commentHeader('', 'foo\nbar')).toEqual(expected)
    })
  })
  describe('bookends', () => {
    it('has a models prologue', () => {
      expect(gen.modelsPrologue('')).toEqual(`
# NOTE: Do not edit this file generated by Looker SDK Codegen
import datetime
import enum
from typing import Any, MutableMapping, Optional, Sequence

try:
    from typing import ForwardRef  # type: ignore
except ImportError:
    from typing import _ForwardRef as ForwardRef  # type: ignore

import attr

from looker_sdk.rtl import model
from looker_sdk.rtl import serialize as sr

EXPLICIT_NULL = model.EXPLICIT_NULL  # type: ignore
DelimSequence = model.DelimSequence
`)
    })
    it('has a methods prologue', () => {
      expect(gen.methodsPrologue('')).toEqual(`
# NOTE: Do not edit this file generated by Looker SDK Codegen
import datetime
from typing import Any, MutableMapping, Optional, Sequence, Union

from . import models
from looker_sdk.rtl import api_methods
from looker_sdk.rtl import transport

class LookerSDK(api_methods.APIMethods):
`)
    })
    it('has a models epilogue', () => {
      const type = apiTestModel.types.LookmlModelExploreJoins
      gen.declareType(indent, type)
      expect(gen.modelsEpilogue('')).toEqual(`

# The following cattrs structure hook registrations are a workaround
# for https://github.com/Tinche/cattrs/pull/42 Once this issue is resolved
# these calls will be removed.

import functools  # noqa:E402

forward_ref_structure_hook = functools.partial(sr.forward_ref_structure_hook, globals(), sr.converter)
translate_keys_structure_hook = functools.partial(sr.translate_keys_structure_hook, sr.converter)
sr.converter.register_structure_hook(
    ForwardRef("LookmlModelExploreJoins"),  # type: ignore
    forward_ref_structure_hook  # type:ignore
)
sr.converter.register_structure_hook(
    LookmlModelExploreJoins,  # type: ignore
    translate_keys_structure_hook  # type:ignore
)
`)
    })
    it('does not have a methods epilogue', () => {
      expect(gen.methodsEpilogue('')).toEqual('')
    })
  })

  describe('parameter declarations', () => {
    it('required parameter', () => {
      const method = apiTestModel.methods.run_query
      const param = method.params[0]
      const actual = gen.declareParameter(indent, method, param)
      expect(actual).toEqual('# Id of query\nquery_id: int')
    })
    it('optional parameter', () => {
      const method = apiTestModel.methods.run_query
      const param = method.params[2]
      const actual = gen.declareParameter(indent, method, param)
      expect(actual).toEqual(
        '# Row limit (may override the limit in the saved query).\n' +
          'limit: Optional[int] = None'
      )
    })
    it('required typed parameter', () => {
      const method = apiTestModel.methods.create_query_render_task
      const param = method.params[2]
      const actual = gen.declareParameter(indent, method, param)
      expect(actual).toEqual(`# Output width in pixels\nwidth: int`)
    })
  })

  describe('args locations', () => {
    it('path and query args', () => {
      const method = apiTestModel.methods.run_query
      expect(method.pathArgs).toEqual(['query_id', 'result_format'])
      expect(method.bodyArg).toEqual('')
      expect(method.queryArgs).toEqual([
        'limit',
        'apply_formatting',
        'apply_vis',
        'cache',
        'image_width',
        'image_height',
        'generate_drill_links',
        'force_production',
        'cache_only',
        'path_prefix',
        'rebuild_pdts',
        'server_table_calcs',
      ])
      expect(method.headerArgs).toEqual([])
      expect(method.cookieArgs).toEqual([])
    })
    it('body for create_query', () => {
      // TODO get resolution working correctly
      const method = apiTestModel.methods.create_query
      expect(method.pathArgs).toEqual([])
      const body = method.getParams('body')
      expect(body.length).toEqual(1)
      expect(body[0].type.name).toEqual('Query')
      expect(method.bodyArg).toEqual('body')
      expect(method.queryArgs).toEqual(['fields'])
      expect(method.headerArgs).toEqual([])
      expect(method.cookieArgs).toEqual([])
    })
    it('body for create_dashboard', () => {
      // TODO get resolution working correctly
      const method = apiTestModel.methods.create_dashboard
      expect(method.pathArgs).toEqual([])
      const body = method.getParams('body')
      expect(body.length).toEqual(1)
      expect(body[0].type.name).toEqual('Dashboard')
      expect(method.bodyArg).toEqual('body')
      expect(method.queryArgs).toEqual([])
      expect(method.headerArgs).toEqual([])
      expect(method.cookieArgs).toEqual([])
    })
  })

  describe('httpArgs', () => {
    it('add_group_group', () => {
      const method = apiTestModel.methods.add_group_group
      const args = gen.httpArgs('', method).trim()
      const expected = `f"/groups/{group_id}/groups",
            models.Group,
            body=body,
            transport_options=transport_options`
      expect(args).toEqual(expected)
    })
    it('create_query', () => {
      const method = apiTestModel.methods.create_query
      const args = gen.httpArgs('', method).trim()
      const expected = `f"/queries",
            models.Query,
            query_params={"fields": fields},
            body=body,
            transport_options=transport_options`
      expect(args).toEqual(expected)
    })
    it('create_dashboard', () => {
      const method = apiTestModel.methods.create_dashboard
      const args = gen.httpArgs('', method).trim()
      const expected = `f"/dashboards",
            models.Dashboard,
            body=body,
            transport_options=transport_options`
      expect(args).toEqual(expected)
    })
  })

  describe('method signature', () => {
    it('no params with all_datagroups', () => {
      const method = apiTestModel.methods.all_datagroups
      const expected = `# ### Get information about all datagroups.
#
# GET /datagroups -> Sequence[models.Datagroup]
def all_datagroups(
    self,
    transport_options: Optional[transport.PTransportSettings] = None,
) -> Sequence[models.Datagroup]:
`
      const actual = gen.methodSignature('', method)
      expect(actual).toEqual(expected)
    })
    it('DelimSequence with test_connection', () => {
      const method = apiTestModel.methods.test_connection
      const expected = `# ### Test an existing connection.
#
# Note that a connection's 'dialect' property has a 'connection_tests' property that lists the
# specific types of tests that the connection supports.
#
# This API is rate limited.
#
# Unsupported tests in the request will be ignored.
#
# PUT /connections/{connection_name}/test -> Sequence[models.DBConnectionTestResult]
def test_connection(
    self,
    # Name of connection
    connection_name: str,
    # Array of names of tests to run
    tests: Optional[models.DelimSequence[str]] = None,
    transport_options: Optional[transport.PTransportSettings] = None,
) -> Sequence[models.DBConnectionTestResult]:
`
      const actual = gen.methodSignature('', method)
      expect(actual).toEqual(expected)
    })
    it('binary return type render_task_results', () => {
      const method = apiTestModel.methods.render_task_results
      const expected = `# ### Get the document or image produced by a completed render task.
#
# Note that the PDF or image result will be a binary blob in the HTTP response, as indicated by the
# Content-Type in the response headers. This may require specialized (or at least different) handling than text
# responses such as JSON. You may need to tell your HTTP client that the response is binary so that it does not
# attempt to parse the binary data as text.
#
# If the render task exists but has not finished rendering the results, the response HTTP status will be
# **202 Accepted**, the response body will be empty, and the response will have a Retry-After header indicating
# that the caller should repeat the request at a later time.
#
# Returns 404 if the render task cannot be found, if the cached result has expired, or if the caller
# does not have permission to view the results.
#
# For detailed information about the status of the render task, use [Render Task](#!/RenderTask/render_task).
# Polling loops waiting for completion of a render task would be better served by polling **render_task(id)** until
# the task status reaches completion (or error) instead of polling **render_task_results(id)** alone.
#
# GET /render_tasks/{render_task_id}/results -> bytes
def render_task_results(
    self,
    # Id of render task
    render_task_id: str,
    transport_options: Optional[transport.PTransportSettings] = None,
) -> bytes:
`
      const actual = gen.methodSignature('', method)
      expect(actual).toEqual(expected)
    })

    it('binary or string return type run_url_encoded_query', () => {
      const method = apiTestModel.methods.run_url_encoded_query
      const expected = `# ### Run an URL encoded query.
#
# This requires the caller to encode the specifiers for the query into the URL query part using
# Looker-specific syntax as explained below.
#
# Generally, you would want to use one of the methods that takes the parameters as json in the POST body
# for creating and/or running queries. This method exists for cases where one really needs to encode the
# parameters into the URL of a single 'GET' request. This matches the way that the Looker UI formats
# 'explore' URLs etc.
#
# The parameters here are very similar to the json body formatting except that the filter syntax is
# tricky. Unfortunately, this format makes this method not currently callable via the 'Try it out!' button
# in this documentation page. But, this is callable when creating URLs manually or when using the Looker SDK.
#
# Here is an example inline query URL:
#
# \`\`\`
# https://looker.mycompany.com:19999/api/3.0/queries/models/thelook/views/inventory_items/run/json?fields=category.name,inventory_items.days_in_inventory_tier,products.count&f[category.name]=socks&sorts=products.count+desc+0&limit=500&query_timezone=America/Los_Angeles
# \`\`\`
#
# When invoking this endpoint with the Ruby SDK, pass the query parameter parts as a hash. The hash to match the above would look like:
#
# \`\`\`ruby
# query_params =
# {
#   :fields => "category.name,inventory_items.days_in_inventory_tier,products.count",
#   :"f[category.name]" => "socks",
#   :sorts => "products.count desc 0",
#   :limit => "500",
#   :query_timezone => "America/Los_Angeles"
# }
# response = ruby_sdk.run_url_encoded_query('thelook','inventory_items','json', query_params)
#
# \`\`\`
#
# Again, it is generally easier to use the variant of this method that passes the full query in the POST body.
# This method is available for cases where other alternatives won't fit the need.
#
# Supported formats:
#
# | result_format | Description
# | :-----------: | :--- |
# | json | Plain json
# | json_detail | Row data plus metadata describing the fields, pivots, table calcs, and other aspects of the query
# | csv | Comma separated values with a header
# | txt | Tab separated values with a header
# | html | Simple html
# | md | Simple markdown
# | xlsx | MS Excel spreadsheet
# | sql | Returns the generated SQL rather than running the query
# | png | A PNG image of the visualization of the query
# | jpg | A JPG image of the visualization of the query
#
# GET /queries/models/{model_name}/views/{view_name}/run/{result_format} -> Union[str, bytes]
def run_url_encoded_query(
    self,
    # Model name
    model_name: str,
    # View name
    view_name: str,
    # Format of result
    result_format: str,
    transport_options: Optional[transport.PTransportSettings] = None,
) -> Union[str, bytes]:
`
      const actual = gen.methodSignature('', method)
      expect(actual).toEqual(expected)
    })
  })

  describe('method body', () => {
    it('encodes string path params', () => {
      const method = apiTestModel.methods.run_url_encoded_query
      const expected = `model_name = self.encode_path_param(model_name)
view_name = self.encode_path_param(view_name)
result_format = self.encode_path_param(result_format)
`
      const actual = gen.encodePathParams('', method)
      expect(actual).toEqual(expected)
    })

    it('encodes only string path params', () => {
      const method = apiTestModel.methods.run_look
      // should NOT escape look_id (int)
      const expected = 'result_format = self.encode_path_param(result_format)\n'
      const actual = gen.encodePathParams('', method)
      expect(actual).toEqual(expected)
    })

    it('assert response is model add_group_group', () => {
      const method = apiTestModel.methods.add_group_group
      const expected = `response = self.post(
            f"/groups/{group_id}/groups",
            models.Group,
            body=body,
            transport_options=transport_options
)
assert isinstance(response, models.Group)
return response`
      const actual = gen.httpCall(indent, method)
      expect(actual).toEqual(expected)
    })
    it('assert response is None delete_group_from_group', () => {
      const method = apiTestModel.methods.delete_group_from_group
      const expected = `response = self.delete(
            f"/groups/{group_id}/groups/{deleting_group_id}",
            None,
            transport_options=transport_options
)
assert response is None
return response`
      const actual = gen.httpCall(indent, method)
      expect(actual).toEqual(expected)
    })
    it('assert response is list active_themes', () => {
      const method = apiTestModel.methods.active_themes
      const expected = `response = self.get(
            f"/themes/active",
            Sequence[models.Theme],
            query_params={"name": name, "ts": ts, "fields": fields},
            transport_options=transport_options
)
assert isinstance(response, list)
return response`
      const actual = gen.httpCall(indent, method)
      expect(actual).toEqual(expected)
    })
    it('assert response is dict query_task_results', () => {
      const method = apiTestModel.methods.query_task_results
      const expected = `response = self.get(
            f"/query_tasks/{query_task_id}/results",
            str,
            transport_options=transport_options
)
assert isinstance(response, str)
return response`
      const actual = gen.httpCall(indent, method)
      expect(actual).toEqual(expected)
    })
    it('assert response is bytes render_task_results', () => {
      const method = apiTestModel.methods.render_task_results
      const expected = `response = self.get(
            f"/render_tasks/{render_task_id}/results",
            bytes,
            transport_options=transport_options
)
assert isinstance(response, bytes)
return response`
      const actual = gen.httpCall(indent, method)
      expect(actual).toEqual(expected)
    })
    it('assert response is bytes or str run_url_encoded_query', () => {
      const method = apiTestModel.methods.run_url_encoded_query
      const expected = `response = self.get(
            f"/queries/models/{model_name}/views/{view_name}/run/{result_format}",
            Union[str, bytes],  # type: ignore
            transport_options=transport_options
)
assert isinstance(response, (str, bytes))
return response`
      const actual = gen.httpCall(indent, method)
      expect(actual).toEqual(expected)
    })
  })

  describe('type creation', () => {
    it('with arrays and hashes', () => {
      const type = apiTestModel.types.Workspace
      const actual = gen.declareType(indent, type)
      expect(type.properties.id.type.name).toEqual('string')
      expect(actual).toEqual(`
@attr.s(auto_attribs=True, init=False)
class Workspace(model.Model):
    """
    Attributes:
        can: Operations the current user is able to perform on this object
        id: The unique id of this user workspace. Predefined workspace ids include "production" and "dev"
        projects: The local state of each project in the workspace
    """
    can: Optional[MutableMapping[str, bool]] = None
    id: Optional[str] = None
    projects: Optional[Sequence["Project"]] = None

    def __init__(self, *,
            can: Optional[MutableMapping[str, bool]] = None,
            id: Optional[str] = None,
            projects: Optional[Sequence["Project"]] = None):
        self.can = can
        self.id = id
        self.projects = projects`)
    })
    it('re-orders required props to top', () => {
      const type = apiTestModel.types.CreateDashboardFilter
      const actual = gen.declareType(indent, type)
      expect(actual).toEqual(`
@attr.s(auto_attribs=True, init=False)
class CreateDashboardFilter(model.Model):
    """
    Attributes:
        dashboard_id: Id of Dashboard
        name: Name of filter
        title: Title of filter
        type: Type of filter: one of date, number, string, or field
        id: Unique Id
        default_value: Default value of filter
        model: Model of filter (required if type = field)
        explore: Explore of filter (required if type = field)
        dimension: Dimension of filter (required if type = field)
        field: Field information
        row: Display order of this filter relative to other filters
        listens_to_filters: Array of listeners for faceted filters
        allow_multiple_values: Whether the filter allows multiple filter values
        required: Whether the filter requires a value to run the dashboard
        ui_config: The visual configuration for this filter. Used to set up how the UI for this filter should appear.
    """
    dashboard_id: str
    name: str
    title: str
    type: str
    id: Optional[str] = None
    default_value: Optional[str] = None
    model: Optional[str] = None
    explore: Optional[str] = None
    dimension: Optional[str] = None
    field: Optional[MutableMapping[str, Any]] = None
    row: Optional[int] = None
    listens_to_filters: Optional[Sequence[str]] = None
    allow_multiple_values: Optional[bool] = None
    required: Optional[bool] = None
    ui_config: Optional[MutableMapping[str, Any]] = None

    def __init__(self, *,
            dashboard_id: str,
            name: str,
            title: str,
            type: str,
            id: Optional[str] = None,
            default_value: Optional[str] = None,
            model: Optional[str] = None,
            explore: Optional[str] = None,
            dimension: Optional[str] = None,
            field: Optional[MutableMapping[str, Any]] = None,
            row: Optional[int] = None,
            listens_to_filters: Optional[Sequence[str]] = None,
            allow_multiple_values: Optional[bool] = None,
            required: Optional[bool] = None,
            ui_config: Optional[MutableMapping[str, Any]] = None):
        self.dashboard_id = dashboard_id
        self.name = name
        self.title = title
        self.type = type
        self.id = id
        self.default_value = default_value
        self.model = model
        self.explore = explore
        self.dimension = dimension
        self.field = field
        self.row = row
        self.listens_to_filters = listens_to_filters
        self.allow_multiple_values = allow_multiple_values
        self.required = required
        self.ui_config = ui_config`)
    })
    it('with translated keywords', () => {
      const type = apiTestModel.types.LookmlModelExploreJoins
      const actual = gen.declareType(indent, type)
      // note the "from_" property
      expect(actual).toEqual(`
@attr.s(auto_attribs=True, init=False)
class LookmlModelExploreJoins(model.Model):
    """
    Attributes:
        name: Name of this join (and name of the view to join)
        dependent_fields: Fields referenced by the join
        fields: Fields of the joined view to pull into this explore
        foreign_key: Name of the dimension in this explore whose value is in the primary key of the joined view
        from_: Name of view to join
        outer_only: Specifies whether all queries must use an outer join
        relationship: many_to_one, one_to_one, one_to_many, many_to_many
        required_joins: Names of joins that must always be included in SQL queries
        sql_foreign_key: SQL expression that produces a foreign key
        sql_on: SQL ON expression describing the join condition
        sql_table_name: SQL table name to join
        type: The join type: left_outer, full_outer, inner, or cross
        view_label: Label to display in UI selectors
    """
    name: Optional[str] = None
    dependent_fields: Optional[Sequence[str]] = None
    fields: Optional[Sequence[str]] = None
    foreign_key: Optional[str] = None
    from_: Optional[str] = None
    outer_only: Optional[bool] = None
    relationship: Optional[str] = None
    required_joins: Optional[Sequence[str]] = None
    sql_foreign_key: Optional[str] = None
    sql_on: Optional[str] = None
    sql_table_name: Optional[str] = None
    type: Optional[str] = None
    view_label: Optional[str] = None

    def __init__(self, *,
            name: Optional[str] = None,
            dependent_fields: Optional[Sequence[str]] = None,
            fields: Optional[Sequence[str]] = None,
            foreign_key: Optional[str] = None,
            from_: Optional[str] = None,
            outer_only: Optional[bool] = None,
            relationship: Optional[str] = None,
            required_joins: Optional[Sequence[str]] = None,
            sql_foreign_key: Optional[str] = None,
            sql_on: Optional[str] = None,
            sql_table_name: Optional[str] = None,
            type: Optional[str] = None,
            view_label: Optional[str] = None):
        self.name = name
        self.dependent_fields = dependent_fields
        self.fields = fields
        self.foreign_key = foreign_key
        self.from_ = from_
        self.outer_only = outer_only
        self.relationship = relationship
        self.required_joins = required_joins
        self.sql_foreign_key = sql_foreign_key
        self.sql_on = sql_on
        self.sql_table_name = sql_table_name
        self.type = type
        self.view_label = view_label`)
    })
    it('with refs, arrays and nullable', () => {
      const type = apiTestModel.types.ApiVersion
      expect(type.properties.looker_release_version.type.name).toEqual('string')
      const actual = gen.declareType(indent, type)
      expect(actual).toEqual(`
@attr.s(auto_attribs=True, init=False)
class ApiVersion(model.Model):
    """
    Attributes:
        looker_release_version: Current Looker release version number
        current_version:
        supported_versions: Array of versions supported by this Looker instance
    """
    looker_release_version: Optional[str] = None
    current_version: Optional["ApiVersionElement"] = None
    supported_versions: Optional[Sequence["ApiVersionElement"]] = None

    def __init__(self, *,
            looker_release_version: Optional[str] = None,
            current_version: Optional["ApiVersionElement"] = None,
            supported_versions: Optional[Sequence["ApiVersionElement"]] = None):
        self.looker_release_version = looker_release_version
        self.current_version = current_version
        self.supported_versions = supported_versions`)
    })

    function checkMappedType(
      type: IType,
      expectedTypeName: string,
      expectedMapping: IMappedType
    ) {
      expect(type.name).toEqual(expectedTypeName)
      const mapped = gen.typeMapModels(type)
      expect(mapped).toEqual(expectedMapping)
    }

    it('enum type', () => {
      const type = apiTestModel.types.PermissionType as IEnumType
      expect(type).toBeDefined()
      expect(type.values).toEqual(['view', 'edit'])
      const actual = gen.declareType('', type)
      const expected = `
class PermissionType(enum.Enum):
    """
    Type of permission: "view" or "edit" Valid values are: "view", "edit".

    """
    view = "view"
    edit = "edit"
    invalid_api_enum_value = "invalid_api_enum_value"


PermissionType.__new__ = model.safe_enum__new__`
      expect(actual).toEqual(expected)
    })

    it('needs __annotations__', () => {
      const type = apiTestModel.types.RequiredResponseWithEnums
      expect(type).toBeDefined()
      const actual = gen.declareType('', type)
      const expected = `
@attr.s(auto_attribs=True, init=False)
class RequiredResponseWithEnums(model.Model):
    """
    Attributes:
        query_id: Id of query to run
        result_format: Desired async query result format. Valid values are: "inline_json", "json", "json_detail", "json_fe", "csv", "html", "md", "txt", "xlsx", "gsxml".
        user:
        an_array_of_enums: An array of user attribute types that are allowed to be used in filters on this field. Valid values are: "advanced_filter_string", "advanced_filter_number", "advanced_filter_datetime", "string", "number", "datetime", "relative_url", "yesno", "zipcode".
        roles: Roles assigned to group
    """
    query_id: int
    result_format: "ResultFormat"
    user: "UserPublic"
    an_array_of_enums: Optional[Sequence["AnArrayOfEnums"]] = None
    roles: Optional[Sequence["Role"]] = None
    __annotations__ = {
        "query_id": int,
        "result_format": ForwardRef("ResultFormat"),
        "user": ForwardRef("UserPublic"),
        "an_array_of_enums": Optional[Sequence["AnArrayOfEnums"]],
        "roles": Optional[Sequence["Role"]]
    }

    def __init__(self, *,
            query_id: int,
            result_format: "ResultFormat",
            user: "UserPublic",
            an_array_of_enums: Optional[Sequence["AnArrayOfEnums"]] = None,
            roles: Optional[Sequence["Role"]] = None):
        self.query_id = query_id
        self.result_format = result_format
        self.user = user
        self.an_array_of_enums = an_array_of_enums
        self.roles = roles`
      expect(actual).toEqual(expected)
    })

    it('input models', () => {
      // TODO this side-effect should NOT be required for the test
      // type declarations should be atomic w/o side-effect requirements
      // run method generation to populate inputTypes
      const method = apiTestModel.methods.create_merge_query
      const param = method.bodyParams[0]
      gen.declareParameter(indent, method, param)

      const inputType = apiTestModel.types.WriteMergeQuery
      const asVal = expect.any(Function)
      checkMappedType(inputType.properties.column_limit.type, 'string', {
        default: gen.nullStr,
        name: 'str',
        asVal: asVal,
      })
      checkMappedType(inputType.properties.dynamic_fields.type, 'string', {
        default: gen.nullStr,
        name: 'str',
        asVal: asVal,
      })
      checkMappedType(inputType.properties.pivots.type, 'string[]', {
        default: gen.nullStr,
        name: 'Sequence[str]',
      })
      const actual = gen.declareType(indent, inputType)
      expect(actual).toEqual(`
@attr.s(auto_attribs=True, init=False)
class WriteMergeQuery(model.Model):
    """
    Dynamically generated writeable type for MergeQuery removes properties:
can, id, result_maker_id

    Attributes:
        column_limit: Column Limit
        dynamic_fields: Dynamic Fields
        pivots: Pivots
        sorts: Sorts
        source_queries: Source Queries defining the results to be merged.
        total: Total
        vis_config: Visualization Config
    """
    column_limit: Optional[str] = None
    dynamic_fields: Optional[str] = None
    pivots: Optional[Sequence[str]] = None
    sorts: Optional[Sequence[str]] = None
    source_queries: Optional[Sequence["MergeQuerySourceQuery"]] = None
    total: Optional[bool] = None
    vis_config: Optional[MutableMapping[str, Any]] = None

    def __init__(self, *,
            column_limit: Optional[str] = None,
            dynamic_fields: Optional[str] = None,
            pivots: Optional[Sequence[str]] = None,
            sorts: Optional[Sequence[str]] = None,
            source_queries: Optional[Sequence["MergeQuerySourceQuery"]] = None,
            total: Optional[bool] = None,
            vis_config: Optional[MutableMapping[str, Any]] = None):
        self.column_limit = column_limit
        self.dynamic_fields = dynamic_fields
        self.pivots = pivots
        self.sorts = sorts
        self.source_queries = source_queries
        self.total = total
        self.vis_config = vis_config`)

      const childInputType = apiTestModel.types.MergeQuerySourceQuery
      const childActual = gen.declareType(indent, childInputType)
      expect(childActual).toEqual(`
@attr.s(auto_attribs=True, init=False)
class MergeQuerySourceQuery(model.Model):
    """
    Attributes:
        merge_fields: An array defining which fields of the source query are mapped onto fields of the merge query
        name: Display name
        query_id: Id of the query to merge
    """
    merge_fields: Optional[Sequence["MergeFields"]] = None
    name: Optional[str] = None
    query_id: Optional[int] = None

    def __init__(self, *,
            merge_fields: Optional[Sequence["MergeFields"]] = None,
            name: Optional[str] = None,
            query_id: Optional[int] = None):
        self.merge_fields = merge_fields
        self.name = name
        self.query_id = query_id`)

      const grandChildInputType = apiTestModel.types.MergeFields
      const grandChildActual = gen.declareType(indent, grandChildInputType)
      expect(grandChildActual).toEqual(`
@attr.s(auto_attribs=True, init=False)
class MergeFields(model.Model):
    """
    Attributes:
        field_name: Field name to map onto in the merged results
        source_field_name: Field name from the source query
    """
    field_name: Optional[str] = None
    source_field_name: Optional[str] = None

    def __init__(self, *,
            field_name: Optional[str] = None,
            source_field_name: Optional[str] = None):
        self.field_name = field_name
        self.source_field_name = source_field_name`)
    })
  })

  describe('makeTheCall', () => {
    const fields = 'id,user_id,title,description'
    it('handles no params', () => {
      const inputs = {}
      const method = apiTestModel.methods.run_look
      const actual = gen.makeTheCall(method, inputs)
      const expected = 'response = sdk.run_look()'
      expect(actual).toEqual(expected)
    })

    it('assigns single param', () => {
      const inputs = { look_id: 17 }
      const method = apiTestModel.methods.look
      const actual = gen.makeTheCall(method, inputs)
      const expected = `response = sdk.look(look_id=17)`
      expect(actual).toEqual(expected)
    })

    it('assigns simple params', () => {
      const inputs = { look_id: 17, fields }
      const method = apiTestModel.methods.look
      const actual = gen.makeTheCall(method, inputs)
      const expected = `response = sdk.look(
    look_id=17,
    fields="${fields}")`
      expect(actual).toEqual(expected)
    })

    it('assigns a body param', () => {
      const body: IWriteLookWithQuery = {
        title: 'test title',
        description: 'gen test',
        query: {
          model: 'the_look',
          view: 'users',
          total: true,
        },
      }
      const inputs = { look_id: 17, body, fields }
      const method = apiTestModel.methods.update_look
      const actual = gen.makeTheCall(method, inputs)
      const expected = `response = sdk.update_look(
    look_id=17,
    body=models.WriteLookWithQuery(
        title="test title",
        description="gen test",
        query=models.WriteQuery(
            model="the_look",
            view="users",
            total=true
        )
    ),
    fields="id,user_id,title,description")`
      expect(actual).toEqual(expected)
    })

    it('assigns an enum', () => {
      const inputs: IRequestCreateQueryTask = {
        body: {
          query_id: 1,
          result_format: ResultFormat.csv,
        },
      }
      const method = apiTestModel.methods.create_query_task
      const actual = gen.makeTheCall(method, inputs)
      const expected = `response = sdk.create_query_task(
    body=models.WriteCreateQueryTask(
        query_id=1,
        result_format=models.ResultFormat.csv
    ))`
      expect(actual).toEqual(expected)
    })

    it('assigns a DelimArray', () => {
      const inputs: IRequestAllUsers = {
        ids: new DelimArray<number>([1, 2, 3]),
      }
      const method = apiTestModel.methods.all_users
      const actual = gen.makeTheCall(method, inputs)
      const expected = `response = sdk.all_users(
    ids=models.DelimSequence([1,2,3]))`
      expect(actual).toEqual(expected)
    })

    it('assigns a DelimArray', () => {
      const inputs: IRequestAllUsers = {
        ids: new DelimArray<number>([1, 2, 3]),
      }
      const method = apiTestModel.methods.all_users
      const actual = gen.makeTheCall(method, inputs)
      const expected = `response = sdk.all_users(
    ids=models.DelimSequence([1,2,3]))`
      expect(actual).toEqual(expected)
    })

    it('assigns simple and complex arrays', () => {
      const body: IWriteMergeQuery = {
        column_limit: '5',
        pivots: ['one', 'two', 'three'],
        sorts: ['a'],
        source_queries: [
          {
            name: 'first query',
            query_id: 1,
            merge_fields: [
              {
                field_name: 'merge_1',
                source_field_name: 'source_1',
              },
            ],
          },
          {
            name: 'second query',
            query_id: 2,
            merge_fields: [
              {
                field_name: 'merge_2',
                source_field_name: 'source_2',
              },
            ],
          },
        ],
      }
      const inputs = { body, fields }
      const method = apiTestModel.methods.create_merge_query
      const actual = gen.makeTheCall(method, inputs)
      const expected = `response = sdk.create_merge_query(
    body=models.WriteMergeQuery(
        column_limit="5",
        pivots=[
            "one",
            "two",
            "three"
        ],
        sorts=["a"],
        source_queries=[
            models.MergeQuerySourceQuery(
                merge_fields=[
                    models.MergeFields(
                        field_name="merge_1",
                        source_field_name="source_1"
                    )
                ],
                name="first query",
                query_id=1
            ),
            models.MergeQuerySourceQuery(
                merge_fields=[
                    models.MergeFields(
                        field_name="merge_2",
                        source_field_name="source_2"
                    )
                ],
                name="second query",
                query_id=2
            )
        ]
    ),
    fields="id,user_id,title,description")`
      expect(actual).toEqual(expected)
    })

    it('assigns dictionaries', () => {
      const query: ISqlQueryCreate = {
        connection_name: 'looker',
        model_name: 'the_look',
        vis_config: { first: 1, second: 'two' },
      }
      const inputs = { body: query }
      const method = apiTestModel.methods.create_sql_query
      const expected = `response = sdk.create_sql_query(
    body=models.SqlQueryCreate(
        connection_name="looker",
        model_name="the_look",
        vis_config=dict(
            first=1,
            second="two"
        )
    ))`
      const actual = gen.makeTheCall(method, inputs)
      expect(actual).toEqual(expected)
    })

    describe('hashValue', () => {
      it('assigns a hash with heterogeneous values', () => {
        const token: IAccessToken = {
          access_token: 'backstage',
          token_type: 'test',
          expires_in: 10,
        }
        const oneItem = [1]
        const threeItems = ['Abe', 'Zeb', token]
        const inputs: IDictionary<any> = {
          item: oneItem,
          items: threeItems,
          first: 1,
          second: 'two',
          third: false,
          token,
        }
        const expected = `dict(
    item=[1],
    items=[
        "Abe",
        "Zeb",
        dict(
            access_token="backstage",
            token_type="test",
            expires_in=10
        )
    ],
    first=1,
    second="two",
    third=false,
    token=dict(
        access_token="backstage",
        token_type="test",
        expires_in=10
    )
)`
        const actual = gen.hashValue('', inputs)
        expect(actual).toEqual(expected)
      })
    })
    describe('assignType', () => {
      it('assigns a complex type', () => {
        const inputs: IMergeQuerySourceQuery = {
          name: 'first query',
          query_id: 1,
          merge_fields: [
            {
              field_name: 'merge_1',
              source_field_name: 'source_1',
            },
          ],
        }
        const type = apiTestModel.types.MergeQuerySourceQuery
        expect(type).toBeDefined()
        const expected = `models.MergeQuerySourceQuery(
        merge_fields=[
            models.MergeFields(
                field_name="merge_1",
                source_field_name="source_1"
            )
        ],
        name="first query",
        query_id=1
    )`
        const actual = gen.assignType(gen.indentStr, type, inputs)
        expect(actual).toEqual(expected)
      })
    })
  })
})
